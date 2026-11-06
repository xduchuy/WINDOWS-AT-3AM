import {
  Color3,
  Color4,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { QualityPreset } from '../types/game';

/**
 * Manages atmospheric perspective, exponential noir fog, multi-layered rain particle curtains,
 * and volumetric light-spill haze outside illuminated windows.
 */
export class AtmosphereSystem {
  private mainRain: ParticleSystem;
  private foregroundRain: ParticleSystem;
  private fogPlanes: Mesh[] = [];

  constructor(scene: Scene) {
    // 1. Exponential Atmospheric Perspective Fog
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.025, 0.042, 0.078);
    scene.fogDensity = 0.015;

    const rainStreakTex = AtmosphereSystem.createRainStreakTexture(scene);

    // 2. Courtyard Heavy Rain Layer
    this.mainRain = new ParticleSystem('CourtyardRain', 2600, scene);
    this.mainRain.particleTexture = rainStreakTex;
    this.mainRain.emitter = new Vector3(0, 19.5, -5.5);
    this.mainRain.minEmitBox = new Vector3(-13, 0, -10);
    this.mainRain.maxEmitBox = new Vector3(13, 0, 7);

    this.mainRain.color1 = new Color4(0.62, 0.76, 0.94, 0.36);
    this.mainRain.color2 = new Color4(0.85, 0.72, 0.55, 0.28); // catches warm window tungsten spill
    this.mainRain.colorDead = new Color4(0.3, 0.4, 0.55, 0.0);

    this.mainRain.minSize = 0.14;
    this.mainRain.maxSize = 0.28;
    this.mainRain.minScaleX = 0.06;
    this.mainRain.maxScaleX = 0.09;
    this.mainRain.minScaleY = 2.6;
    this.mainRain.maxScaleY = 4.2;

    this.mainRain.minLifeTime = 0.75;
    this.mainRain.maxLifeTime = 1.15;
    this.mainRain.emitRate = 1800;
    this.mainRain.gravity = new Vector3(-0.8, -18.5, 0);
    this.mainRain.direction1 = new Vector3(-0.6, -14.0, 0);
    this.mainRain.direction2 = new Vector3(-0.2, -16.5, 0);
    this.mainRain.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.mainRain.start();

    // 3. Foreground Close-to-Lens Rain Layer
    this.foregroundRain = new ParticleSystem('ForegroundLensRain', 650, scene);
    this.foregroundRain.particleTexture = rainStreakTex;
    this.foregroundRain.emitter = new Vector3(0, 13.0, -14.2);
    this.foregroundRain.minEmitBox = new Vector3(-6, 0, -2.0);
    this.foregroundRain.maxEmitBox = new Vector3(6, 0, 2.0);

    this.foregroundRain.color1 = new Color4(0.55, 0.7, 0.9, 0.25);
    this.foregroundRain.color2 = new Color4(0.45, 0.62, 0.85, 0.18);
    this.foregroundRain.colorDead = new Color4(0.2, 0.3, 0.4, 0.0);

    this.foregroundRain.minSize = 0.18;
    this.foregroundRain.maxSize = 0.32;
    this.foregroundRain.minScaleX = 0.05;
    this.foregroundRain.maxScaleX = 0.08;
    this.foregroundRain.minScaleY = 3.2;
    this.foregroundRain.maxScaleY = 4.8;

    this.foregroundRain.minLifeTime = 0.45;
    this.foregroundRain.maxLifeTime = 0.7;
    this.foregroundRain.emitRate = 480;
    this.foregroundRain.gravity = new Vector3(-0.5, -20.0, 0);
    this.foregroundRain.direction1 = new Vector3(-0.4, -15.0, 0);
    this.foregroundRain.direction2 = new Vector3(-0.1, -17.0, 0);
    this.foregroundRain.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.foregroundRain.start();

    // 4. Low Courtyard Ground Mist Planes
    const mistTex = AtmosphereSystem.createSoftMistTexture(scene);
    const mistMat = new StandardMaterial('CourtyardMistMat', scene);
    mistMat.diffuseTexture = mistTex;
    mistMat.opacityTexture = mistTex;
    mistMat.emissiveColor = new Color3(0.08, 0.13, 0.22);
    mistMat.disableLighting = true;
    mistMat.backFaceCulling = false;

    for (let i = 0; i < 3; i++) {
      const plane = MeshBuilder.CreatePlane(
        `CourtyardMistPlane_${i}`,
        { width: 22, height: 3.6 },
        scene
      );
      plane.position.set(0, 1.3 + i * 0.9, -3.5 - i * 3.2);
      plane.material = mistMat;
      plane.isPickable = false;
      this.fogPlanes.push(plane);
    }
  }

  public applyQualityPreset(preset: QualityPreset, reducedMotion: boolean): void {
    if (reducedMotion) {
      this.mainRain.emitRate = 350;
      this.foregroundRain.emitRate = 80;
      return;
    }

    if (preset === 'high') {
      this.mainRain.emitRate = 1800;
      this.foregroundRain.emitRate = 480;
      this.fogPlanes.forEach((p) => p.setEnabled(true));
    } else if (preset === 'medium') {
      this.mainRain.emitRate = 950;
      this.foregroundRain.emitRate = 220;
      this.fogPlanes.forEach((p) => p.setEnabled(true));
    } else {
      this.mainRain.emitRate = 420;
      this.foregroundRain.emitRate = 0;
      this.fogPlanes.forEach((p) => p.setEnabled(false));
    }
  }

  public update(elapsedSec: number): void {
    for (let i = 0; i < this.fogPlanes.length; i++) {
      this.fogPlanes[i].position.x = Math.sin(elapsedSec * 0.25 + i * 1.7) * 1.4;
    }
  }

  private static createRainStreakTexture(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('rainStreakTex', { width: 64, height: 64 }, scene, true);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 64, 64);
    const grad = ctx.createLinearGradient(32, 2, 32, 62);
    grad.addColorStop(0, 'rgba(200, 225, 255, 0.0)');
    grad.addColorStop(0.5, 'rgba(220, 240, 255, 0.88)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(26, 2, 12, 60);
    tex.hasAlpha = true;
    tex.update();
    return tex;
  }

  private static createSoftMistTexture(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('softMistTex', { width: 128, height: 128 }, scene, true);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 128, 128);
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    grad.addColorStop(0, 'rgba(140, 175, 220, 0.22)');
    grad.addColorStop(1, 'rgba(20, 35, 60, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    tex.hasAlpha = true;
    tex.update();
    return tex;
  }
}
