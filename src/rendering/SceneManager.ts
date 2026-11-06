import {
  Color3,
  Color4,
  ColorCurves,
  DefaultRenderingPipeline,
  DirectionalLight,
  Engine,
  HemisphericLight,
  ImageProcessingConfiguration,
  Mesh,
  Scene,
  Vector3,
  WebGPUEngine,
} from '@babylonjs/core';
import { soundscape } from '../audio/SoundscapeEngine';
import { APARTMENTS } from '../data/apartments';
import { useGameStore } from '../state/useGameStore';
import { ApartmentId, QualityPreset, ResidentId } from '../types/game';
import { ArchitectureBuilder, WindowOpeningNodes } from './ArchitectureBuilder';
import { AtmosphereSystem } from './AtmosphereSystem';
import { CameraController } from './CameraController';
import { ApartmentInteriorNodes, InteriorBuilder } from './InteriorBuilder';
import { QualityProfiler } from './QualityProfiler';
import { ArticulatedResidentRig, ResidentAnimator } from './ResidentAnimator';

export class SceneManager {
  private engine!: Engine;
  private scene!: Scene;
  private cameraController!: CameraController;
  private atmosphere!: AtmosphereSystem;
  private pipeline?: DefaultRenderingPipeline;
  private profiler = new QualityProfiler();

  private windowNodes: Record<ApartmentId, WindowOpeningNodes> = {} as Record<
    ApartmentId,
    WindowOpeningNodes
  >;
  private interiorNodes: Record<ApartmentId, ApartmentInteriorNodes> = {} as Record<
    ApartmentId,
    ApartmentInteriorNodes
  >;
  private residentRigs: Record<ResidentId, ArticulatedResidentRig> = {} as Record<
    ResidentId,
    ArticulatedResidentRig
  >;
  private swayingCables: Mesh[] = [];
  private spinningFans: Mesh[] = [];

  private backendLabel = 'WebGL2 // Filmic PBR';
  private elapsedSec = 0;
  private lastAppliedPreset: QualityPreset | null = null;
  private lastReducedMotion: boolean | null = null;
  private isDisposed = false;

  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    // Use WebGL2 by default for guaranteed multi-light PBR + PostProcess compatibility;
    // support explicit ?webgpu=1 opt-in with automatic fallback to WebGL2.
    let initializedWebGPU = false;
    const forceWebGPU =
      typeof window !== 'undefined' && window.location.search.includes('webgpu=1');

    if (forceWebGPU && typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const webgpu = new WebGPUEngine(canvas, {
          antialias: true,
          adaptToDeviceRatio: true,
        });
        await webgpu.initAsync();
        if (this.isDisposed) {
          webgpu.dispose();
          return;
        }
        this.engine = webgpu as unknown as Engine;
        this.backendLabel = 'WebGPU // Filmic PBR';
        initializedWebGPU = true;
      } catch {
        initializedWebGPU = false;
      }
    }

    if (!initializedWebGPU) {
      this.engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        powerPreference: 'high-performance',
      });
      this.backendLabel = 'WebGL2 // Filmic PBR';
    }

    if (this.isDisposed) {
      this.engine.dispose();
      return;
    }

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.03, 0.055, 0.1, 1.0);

    // 2. Calibrated ACES Filmic Tone Mapping & Urban Noir Color Grading
    const imgCfg = this.scene.imageProcessingConfiguration;
    imgCfg.toneMappingEnabled = true;
    imgCfg.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    imgCfg.exposure = 1.45;
    imgCfg.contrast = 1.22;
    imgCfg.vignetteEnabled = true;
    imgCfg.vignetteWeight = 1.65;
    imgCfg.vignetteColor = new Color4(0.01, 0.02, 0.04, 1.0);

    const curves = new ColorCurves();
    curves.globalHue = 215;
    curves.globalDensity = 10;
    curves.highlightsHue = 36;
    curves.highlightsDensity = 22;
    curves.shadowsHue = 220;
    curves.shadowsDensity = 20;
    imgCfg.colorCurvesEnabled = true;
    imgCfg.colorCurves = curves;

    // 3. Exterior Midnight Moonlight & Wet Courtyard Fill
    const moonHemi = new HemisphericLight(
      'MidnightSkyHemi',
      new Vector3(0.2, 1.0, -0.5),
      this.scene
    );
    moonHemi.diffuse = new Color3(0.38, 0.52, 0.78);
    moonHemi.groundColor = new Color3(0.16, 0.2, 0.28);
    moonHemi.intensity = 1.15;

    const moonDir = new DirectionalLight(
      'MidnightMoonDir',
      new Vector3(-0.3, -0.65, 0.7),
      this.scene
    );
    moonDir.diffuse = new Color3(0.52, 0.68, 0.95);
    moonDir.intensity = 1.25;

    // 4. Camera Controller & Atmospheric Rain/Fog
    this.cameraController = new CameraController(this.scene, canvas);
    this.atmosphere = new AtmosphereSystem(this.scene);

    // 5. Build Courtyard Facade, 12 Apartment Interiors, and 4 Articulated Residents
    const arch = await ArchitectureBuilder.buildCourtyardAndFacade(this.scene);
    if (this.isDisposed) return;

    this.windowNodes = arch.windowNodes;
    this.swayingCables = arch.swayingCables;
    this.spinningFans = arch.spinningFans;

    this.interiorNodes = await InteriorBuilder.buildAllInteriors(this.scene);
    if (this.isDisposed) return;

    this.residentRigs = await ResidentAnimator.buildResidentRigs(this.scene, this.interiorNodes);
    if (this.isDisposed) return;

    // 6. Post-Processing Pipeline (Subtle Bloom + FXAA)
    try {
      this.pipeline = new DefaultRenderingPipeline(
        'NoirPostPipeline',
        true,
        this.scene,
        [this.cameraController.camera]
      );
      this.pipeline.samples = 4;
      this.pipeline.fxaaEnabled = true;
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomThreshold = 0.68;
      this.pipeline.bloomWeight = 0.32;
      this.pipeline.bloomKernel = 64;
      this.pipeline.bloomScale = 0.5;
    } catch {
      // Fallback if post-processing pipeline unsupported on software context
    }

    // 7. Main Render & Simulation Loop
    this.engine.runRenderLoop(() => {
      if (this.isDisposed) return;
      const dt = Math.min(0.1, this.engine.getDeltaTime() / 1000);
      this.elapsedSec += dt;

      this.tickFrame(dt);
      this.scene.render();
      this.profiler.sampleFrame(this.engine, this.backendLabel);
    });

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.isDisposed && this.engine) {
      this.engine.resize();
    }
  };

  private tickFrame(dt: number): void {
    const store = useGameStore.getState();

    // Step deterministic clock & world events
    store.tickSimulation(dt);
    const stepResult = store.stepClueScan(dt);
    if (stepResult.newlyCollected) {
      soundscape.playCue('scan_lock');
    }

    // Sync Audio Focus & Mute State
    soundscape.setMuted(store.audioMuted);
    soundscape.updateSpatialFocus(store.focusedApartmentId, store.zoomLevel);

    // Apply Quality Preset if changed
    if (
      this.lastAppliedPreset !== store.qualityPreset ||
      this.lastReducedMotion !== store.reducedMotion
    ) {
      this.applyQualitySettings(store.qualityPreset, store.reducedMotion);
      this.lastAppliedPreset = store.qualityPreset;
      this.lastReducedMotion = store.reducedMotion;
    }

    // Update Camera
    this.cameraController.update(dt, this.elapsedSec);

    // Update Atmosphere, AC Fans, and Cables
    this.atmosphere.update(this.elapsedSec);
    for (const fan of this.spinningFans) {
      fan.rotation.z += dt * 9.5;
    }
    if (!store.reducedMotion) {
      for (let i = 0; i < this.swayingCables.length; i++) {
        this.swayingCables[i].rotation.x = Math.sin(this.elapsedSec * 1.4 + i) * 0.015;
      }
    }

    // Sync Apartment Lights, Blinds, and Props with Simulation State
    for (const aptId of Object.keys(this.interiorNodes) as ApartmentId[]) {
      const intNode = this.interiorNodes[aptId];
      const winNode = this.windowNodes[aptId];
      const simApt = store.apartments[aptId];
      const aptDef = APARTMENTS[aptId];

      if (!simApt) continue;

      const targetIntensity = simApt.lightOn
        ? aptDef.baseLightIntensity
        : simApt.emergencyBlackout
        ? 0.35 // Emergency amber/red glow during Night 2 blackout so intruder silhouette is visible!
        : 0.12;

      if (intNode.keyLight) {
        intNode.keyLight.intensity +=
          (targetIntensity - intNode.keyLight.intensity) * Math.min(1, dt * 6);
      }
      if (intNode.spotLight) {
        intNode.spotLight.intensity = simApt.lightOn ? 1.55 : 0.4;
      }

      // Scale wall emissive bounce based on light state
      if (intNode.wallMaterial) {
        const emissiveScale = simApt.lightOn
          ? aptDef.isDetailedInteractive
            ? 0.55
            : 0.32
          : simApt.emergencyBlackout
          ? 0.22
          : 0.06;
        intNode.wallMaterial.emissiveIntensity = emissiveScale;
      }

      // Update Venetian blinds height based on schedule
      if (winNode) {
        const targetScaleY =
          simApt.blindsState === 'open' ? 0.22 : simApt.blindsState === 'half' ? 1.15 : 2.1;
        const targetPosY =
          simApt.blindsState === 'open' ? 1.08 : simApt.blindsState === 'half' ? 0.62 : 0.15;
        winNode.blindsMesh.scaling.y +=
          (targetScaleY - winNode.blindsMesh.scaling.y) * Math.min(1, dt * 5);
        winNode.blindsMesh.position.y +=
          (targetPosY - winNode.blindsMesh.position.y) * Math.min(1, dt * 5);
      }

      // Toggle visibility of conditional narrative props
      for (const [propKey, propNode] of Object.entries(intNode.propMeshes)) {
        const isAlwaysOnDefault =
          (propKey === 'prop_violin_workbench' && store.night === 1) ||
          (propKey === 'prop_forged_manifest' && store.night === 1) ||
          (propKey === 'prop_extortion_note_1a' && (store.night === 1 || store.night === 3)) ||
          (propKey === 'prop_stolen_case_2c' &&
            ((store.night === 2 && store.minute >= 130) || store.night === 3));

        const isActiveInSchedule = simApt.activeProps.includes(propKey);
        propNode.setEnabled(isAlwaysOnDefault || isActiveInSchedule);
      }
    }

    // Update Resident Rigs & Animations
    ResidentAnimator.updateResidents(
      this.residentRigs,
      store.residents,
      this.elapsedSec,
      dt
    );
  }

  private applyQualitySettings(preset: QualityPreset, reducedMotion: boolean): void {
    this.atmosphere.applyQualityPreset(preset, reducedMotion);

    if (this.pipeline) {
      this.pipeline.bloomEnabled = preset !== 'low';
      this.pipeline.samples = preset === 'high' ? 4 : preset === 'medium' ? 2 : 1;
    }

    const scale = preset === 'high' ? 1.0 : preset === 'medium' ? 1.15 : 1.35;
    this.engine.setHardwareScalingLevel(scale);
  }

  public dispose(): void {
    this.isDisposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
