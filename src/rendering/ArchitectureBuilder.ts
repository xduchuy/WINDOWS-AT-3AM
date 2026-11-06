import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { APARTMENT_LIST } from '../data/apartments';
import { ApartmentId } from '../types/game';
import { ProceduralTextures } from './ProceduralTextures';

export interface WindowOpeningNodes {
  apartmentId: ApartmentId;
  frameNode: TransformNode;
  glassUpper: Mesh;
  glassLower: Mesh;
  blindsMesh: Mesh;
  acFanBlade?: Mesh;
  hitboxMesh: Mesh;
}

export class ArchitectureBuilder {
  public static async buildCourtyardAndFacade(
    scene: Scene
  ): Promise<{
    root: TransformNode;
    windowNodes: Record<ApartmentId, WindowOpeningNodes>;
    swayingCables: Mesh[];
    spinningFans: Mesh[];
  }> {
    const root = new TransformNode('HalcyonArmsArchitecture', scene);
    const windowNodes = {} as Record<ApartmentId, WindowOpeningNodes>;
    const swayingCables: Mesh[] = [];
    const spinningFans: Mesh[] = [];

    // Load our procedural GLB architectural kit to verify and instantiate glTF assets
    let glbTemplateRoot: TransformNode | null = null;
    try {
      const loaded = await SceneLoader.ImportMeshAsync(
        '',
        '/assets/models/',
        'courtyard_facade_kit.glb',
        scene
      );
      glbTemplateRoot = new TransformNode('GlbKitTemplates', scene);
      for (const m of loaded.meshes) {
        m.setEnabled(false);
        m.parent = glbTemplateRoot;
      }
    } catch {
      // Fallback if running in unit test without HTTP server
    }

    // --- PBR MATERIALS ---
    const brickTex = ProceduralTextures.createWeatheredBrickAlbedo(scene);
    const wetRoughTex = ProceduralTextures.createWetRoughnessMap(scene);
    const dropletTex = ProceduralTextures.createWindowDropletTexture(scene);

    const brickMat = new PBRMaterial('weatheredBrickMat', scene);
    brickMat.albedoTexture = brickTex;
    brickMat.emissiveTexture = brickTex;
    brickMat.emissiveColor = new Color3(0.28, 0.33, 0.42);
    brickMat.metallicTexture = wetRoughTex;
    brickMat.useRoughnessFromMetallicTextureAlpha = false;
    brickMat.useRoughnessFromMetallicTextureGreen = true;
    brickMat.metallic = 0.06;
    brickMat.roughness = 0.62;
    brickMat.maxSimultaneousLights = 4;

    const wetConcreteMat = new PBRMaterial('wetConcreteMat', scene);
    wetConcreteMat.albedoColor = new Color3(0.32, 0.38, 0.46);
    wetConcreteMat.emissiveColor = new Color3(0.1, 0.13, 0.18);
    wetConcreteMat.metallic = 0.08;
    wetConcreteMat.roughness = 0.24; // Wet sheen
    wetConcreteMat.maxSimultaneousLights = 4;

    const courtyardAsphaltMat = new PBRMaterial('courtyardAsphaltMat', scene);
    courtyardAsphaltMat.albedoColor = new Color3(0.14, 0.18, 0.25);
    courtyardAsphaltMat.emissiveColor = new Color3(0.05, 0.08, 0.12);
    courtyardAsphaltMat.metallicTexture = wetRoughTex;
    courtyardAsphaltMat.useRoughnessFromMetallicTextureGreen = true;
    courtyardAsphaltMat.metallic = 0.15;
    courtyardAsphaltMat.roughness = 0.16; // Puddle specular reflections
    courtyardAsphaltMat.maxSimultaneousLights = 4;

    const wroughtIronMat = new PBRMaterial('wroughtIronMat', scene);
    wroughtIronMat.albedoColor = new Color3(0.22, 0.27, 0.34);
    wroughtIronMat.emissiveColor = new Color3(0.07, 0.09, 0.13);
    wroughtIronMat.metallic = 0.82;
    wroughtIronMat.roughness = 0.34;
    wroughtIronMat.maxSimultaneousLights = 4;

    const sashTimberMat = new PBRMaterial('sashTimberMat', scene);
    sashTimberMat.albedoColor = new Color3(0.28, 0.34, 0.42);
    sashTimberMat.emissiveColor = new Color3(0.09, 0.11, 0.15);
    sashTimberMat.metallic = 0.12;
    sashTimberMat.roughness = 0.55;
    sashTimberMat.maxSimultaneousLights = 4;

    const glassMat = new PBRMaterial('windowGlassMat', scene);
    glassMat.albedoColor = new Color3(0.62, 0.78, 0.92);
    glassMat.albedoTexture = dropletTex;
    glassMat.alpha = 0.15;
    glassMat.metallic = 0.1;
    glassMat.roughness = 0.12;
    glassMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    glassMat.maxSimultaneousLights = 4;

    const blindsMat = new PBRMaterial('venetianBlindsMat', scene);
    blindsMat.albedoColor = new Color3(0.85, 0.76, 0.64);
    blindsMat.emissiveColor = new Color3(0.22, 0.18, 0.12);
    blindsMat.metallic = 0.05;
    blindsMat.roughness = 0.62;
    blindsMat.maxSimultaneousLights = 4;

    // --- 1. WET COURTYARD GROUND & SIDE ALLEY WALLS ---
    const ground = MeshBuilder.CreateGround(
      'CourtyardGround',
      { width: 38, height: 34, subdivisions: 8 },
      scene
    );
    ground.position.set(0, 0, -6);
    ground.material = courtyardAsphaltMat;
    ground.receiveShadows = true;
    ground.parent = root;

    // Left & Right enclosing courtyard brick walls for deep urban claustrophobia
    const leftAlleyWall = MeshBuilder.CreateBox(
      'LeftAlleyWall',
      { width: 0.8, height: 18, depth: 24 },
      scene
    );
    leftAlleyWall.position.set(-11.2, 9, -6);
    leftAlleyWall.material = brickMat;
    leftAlleyWall.parent = root;

    const rightAlleyWall = MeshBuilder.CreateBox(
      'RightAlleyWall',
      { width: 0.8, height: 18, depth: 24 },
      scene
    );
    rightAlleyWall.position.set(11.2, 9, -6);
    rightAlleyWall.material = brickMat;
    rightAlleyWall.parent = root;

    // --- 2. FRONT FACADE PIERS & SPANDRELS (WITH 12 CUTOUT OPENINGS) ---
    // Columns are at X = -5.2, 0.0, +5.2 (each window is 2.2m wide x 2.5m tall)
    // Vertical Brick Piers at X = -8.2, -2.6, +2.6, +8.2
    const pierXPositions = [-8.2, -2.6, 2.6, 8.2];
    const pierWidths = [3.6, 2.8, 2.8, 3.6];
    for (let i = 0; i < pierXPositions.length; i++) {
      const pier = MeshBuilder.CreateBox(
        `FacadePier_${i}`,
        { width: pierWidths[i], height: 16.5, depth: 0.48 },
        scene
      );
      pier.position.set(pierXPositions[i], 8.25, 0);
      pier.material = brickMat;
      pier.receiveShadows = true;
      pier.parent = root;
    }

    // Horizontal Brick Spandrels & Stone Belt Courses between floors
    // Floors sit at Y = 2.2, 5.8, 9.4, 13.0 (window openings span Y ± 1.25)
    const spandrelBands = [
      { y: 0.48, h: 0.96 },  // Ground plinth
      { y: 4.0, h: 1.1 },    // Between Floor 1 & 2
      { y: 7.6, h: 1.1 },    // Between Floor 2 & 3
      { y: 11.2, h: 1.1 },   // Between Floor 3 & 4
      { y: 15.2, h: 1.9 },   // Upper frieze & parapet
    ];

    for (const band of spandrelBands) {
      const spandrel = MeshBuilder.CreateBox(
        `FacadeSpandrel_${band.y}`,
        { width: 20.0, height: band.h, depth: 0.46 },
        scene
      );
      spandrel.position.set(0, band.y, 0);
      spandrel.material = brickMat;
      spandrel.receiveShadows = true;
      spandrel.parent = root;

      // Wet concrete belt ledge
      const ledge = MeshBuilder.CreateBox(
        `StoneBelt_${band.y}`,
        { width: 20.3, height: 0.16, depth: 0.65 },
        scene
      );
      ledge.position.set(0, band.y + band.h * 0.5, -0.1);
      ledge.material = wetConcreteMat;
      ledge.parent = root;
    }

    // Heavy Classical Roof Cornice with Dentils
    const roofCornice = MeshBuilder.CreateBox(
      'RoofCornice',
      { width: 20.8, height: 0.55, depth: 1.15 },
      scene
    );
    roofCornice.position.set(0, 16.25, -0.35);
    roofCornice.material = wetConcreteMat;
    roofCornice.parent = root;

    for (let dx = -9.6; dx <= 9.6; dx += 0.8) {
      const corbel = MeshBuilder.CreateBox(
        `CorniceCorbel_${dx}`,
        { width: 0.22, height: 0.38, depth: 0.75 },
        scene
      );
      corbel.position.set(dx, 15.85, -0.25);
      corbel.material = wetConcreteMat;
      corbel.parent = root;
    }

    // Rooftop Water Tower & Silhouetted Chimneys
    const waterTank = MeshBuilder.CreateCylinder(
      'RooftopWaterTower',
      { diameter: 2.6, height: 3.1, tessellation: 16 },
      scene
    );
    waterTank.position.set(-6.2, 18.4, 2.4);
    waterTank.material = sashTimberMat;
    waterTank.parent = root;

    const tankRoof = MeshBuilder.CreateCylinder(
      'WaterTowerCone',
      { diameterTop: 0.1, diameterBottom: 2.8, height: 1.1, tessellation: 16 },
      scene
    );
    tankRoof.position.set(-6.2, 20.5, 2.4);
    tankRoof.material = wroughtIronMat;
    tankRoof.parent = root;

    // --- 3. TWELVE WINDOWS ACROSS FOUR FLOORS ---
    for (const apt of APARTMENT_LIST) {
      const wx = apt.worldCenter[0];
      const wy = apt.worldCenter[1];
      const frameNode = new TransformNode(`WindowNode_${apt.code}`, scene);
      frameNode.position.set(wx, wy, -0.15);
      frameNode.parent = root;

      // Stone sill & lintel
      const sill = MeshBuilder.CreateBox(
        `Sill_${apt.code}`,
        { width: 2.45, height: 0.16, depth: 0.42 },
        scene
      );
      sill.position.set(0, -1.3, -0.08);
      sill.material = wetConcreteMat;
      sill.parent = frameNode;

      const lintel = MeshBuilder.CreateBox(
        `Lintel_${apt.code}`,
        { width: 2.48, height: 0.22, depth: 0.36 },
        scene
      );
      lintel.position.set(0, 1.32, -0.05);
      lintel.material = wetConcreteMat;
      lintel.parent = frameNode;

      // Timber Sash Frame Jambs & Meeting Rail
      const leftJamb = MeshBuilder.CreateBox(
        `LeftJamb_${apt.code}`,
        { width: 0.12, height: 2.55, depth: 0.22 },
        scene
      );
      leftJamb.position.set(-1.08, 0, 0);
      leftJamb.material = sashTimberMat;
      leftJamb.parent = frameNode;

      const rightJamb = MeshBuilder.CreateBox(
        `RightJamb_${apt.code}`,
        { width: 0.12, height: 2.55, depth: 0.22 },
        scene
      );
      rightJamb.position.set(1.08, 0, 0);
      rightJamb.material = sashTimberMat;
      rightJamb.parent = frameNode;

      const meetingRail = MeshBuilder.CreateBox(
        `MeetingRail_${apt.code}`,
        { width: 2.16, height: 0.07, depth: 0.18 },
        scene
      );
      meetingRail.position.set(0, 0.08, -0.02);
      meetingRail.material = sashTimberMat;
      meetingRail.parent = frameNode;

      // Upper & Lower Glass Panes with Condensation Droplets
      const glassUpper = MeshBuilder.CreatePlane(
        `GlassUpper_${apt.code}`,
        { width: 2.05, height: 1.15 },
        scene
      );
      glassUpper.position.set(0, 0.65, -0.02);
      glassUpper.material = glassMat;
      glassUpper.isPickable = false;
      glassUpper.parent = frameNode;

      const glassLower = MeshBuilder.CreatePlane(
        `GlassLower_${apt.code}`,
        { width: 2.05, height: 1.2 },
        scene
      );
      glassLower.position.set(0, -0.6, 0.02);
      glassLower.material = glassMat;
      glassLower.isPickable = false;
      glassLower.parent = frameNode;

      // Animated Venetian Blinds / Curtain Plane inside window
      const blindsMesh = MeshBuilder.CreateBox(
        `Blinds_${apt.code}`,
        { width: 2.02, height: 0.35, depth: 0.04 },
        scene
      );
      blindsMesh.position.set(0, 1.05, 0.12);
      blindsMesh.material = blindsMat;
      blindsMesh.isPickable = false;
      blindsMesh.parent = frameNode;

      // Wrought-Iron Balcony on interactive & center windows
      if (apt.isDetailedInteractive || apt.column === 1) {
        const balconySlab = MeshBuilder.CreateBox(
          `BalconySlab_${apt.code}`,
          { width: 2.65, height: 0.12, depth: 0.95 },
          scene
        );
        balconySlab.position.set(0, -1.36, -0.45);
        balconySlab.material = wetConcreteMat;
        balconySlab.parent = frameNode;

        const topRail = MeshBuilder.CreateBox(
          `BalconyTopRail_${apt.code}`,
          { width: 2.65, height: 0.05, depth: 0.05 },
          scene
        );
        topRail.position.set(0, -0.52, -0.9);
        topRail.material = wroughtIronMat;
        topRail.parent = frameNode;

        for (let bx = -1.2; bx <= 1.2; bx += 0.24) {
          const picket = MeshBuilder.CreateBox(
            `BalconyPicket_${apt.code}_${bx.toFixed(2)}`,
            { width: 0.03, height: 0.84, depth: 0.03 },
            scene
          );
          picket.position.set(bx, -0.94, -0.9);
          picket.material = wroughtIronMat;
          picket.parent = frameNode;
        }
      }

      // External Weathered AC Compressor Unit with Spinning Fan
      let acFanBlade: Mesh | undefined;
      if (apt.floor >= 2 && (apt.column === 0 || apt.column === 2)) {
        const acSide = apt.column === 0 ? -1.65 : 1.65;
        const acBox = MeshBuilder.CreateBox(
          `ACUnit_${apt.code}`,
          { width: 0.78, height: 0.52, depth: 0.45 },
          scene
        );
        acBox.position.set(acSide, -0.65, -0.25);
        acBox.material = wetConcreteMat;
        acBox.parent = frameNode;

        acFanBlade = MeshBuilder.CreateBox(
          `ACFan_${apt.code}`,
          { width: 0.36, height: 0.07, depth: 0.02 },
          scene
        );
        acFanBlade.position.set(acSide - 0.1, -0.65, -0.49);
        acFanBlade.material = wroughtIronMat;
        acFanBlade.parent = frameNode;
        spinningFans.push(acFanBlade);
      }

      // Invisible Raycast Hitbox for clicking/hovering the window
      const hitboxMesh = MeshBuilder.CreateBox(
        `WindowHitbox_${apt.id}`,
        { width: 2.4, height: 2.7, depth: 0.5 },
        scene
      );
      hitboxMesh.position.set(0, 0, -0.1);
      hitboxMesh.visibility = 0;
      hitboxMesh.isPickable = true;
      hitboxMesh.metadata = { apartmentId: apt.id };
      hitboxMesh.parent = frameNode;

      windowNodes[apt.id] = {
        apartmentId: apt.id,
        frameNode,
        glassUpper,
        glassLower,
        blindsMesh,
        acFanBlade,
        hitboxMesh,
      };
    }

    // --- 4. VERTICAL IRON FIRE ESCAPE LADDERS & DRAINPIPES ---
    for (const pipeX of [-6.9, -1.65, 1.65, 6.9]) {
      const pipe = MeshBuilder.CreateCylinder(
        `RainDownspout_${pipeX}`,
        { diameter: 0.11, height: 16.2, tessellation: 8 },
        scene
      );
      pipe.position.set(pipeX, 8.1, -0.28);
      pipe.material = wroughtIronMat;
      pipe.parent = root;
    }

    // Fire escape vertical ladder linking 4A -> 3A -> 2A and 3C -> 2C -> 1C
    for (const ladderX of [-3.85, 3.85]) {
      const railL = MeshBuilder.CreateBox(
        `FireLadderL_${ladderX}`,
        { width: 0.04, height: 13.5, depth: 0.04 },
        scene
      );
      railL.position.set(ladderX - 0.22, 7.5, -0.65);
      railL.material = wroughtIronMat;
      railL.parent = root;

      const railR = MeshBuilder.CreateBox(
        `FireLadderR_${ladderX}`,
        { width: 0.04, height: 13.5, depth: 0.04 },
        scene
      );
      railR.position.set(ladderX + 0.22, 7.5, -0.65);
      railR.material = wroughtIronMat;
      railR.parent = root;

      for (let ry = 1.5; ry <= 14.0; ry += 0.38) {
        const rung = MeshBuilder.CreateBox(
          `FireRung_${ladderX}_${ry.toFixed(2)}`,
          { width: 0.44, height: 0.025, depth: 0.025 },
          scene
        );
        rung.position.set(ladderX, ry, -0.65);
        rung.material = wroughtIronMat;
        rung.parent = root;
      }
    }

    // --- 5. CATENARY ELECTRICAL CABLES ACROSS COURTYARD ---
    const cableConfigs = [
      { start: new Vector3(-9.5, 11.8, -11.0), end: new Vector3(-2.6, 11.2, -0.3), sag: 0.85 },
      { start: new Vector3(9.5, 10.4, -12.5), end: new Vector3(2.6, 9.5, -0.3), sag: 0.95 },
      { start: new Vector3(-8.2, 6.8, -0.3), end: new Vector3(8.2, 6.2, -0.3), sag: 1.15 },
    ];

    for (let c = 0; c < cableConfigs.length; c++) {
      const cfg = cableConfigs[c];
      const pts: Vector3[] = [];
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const p = Vector3.Lerp(cfg.start, cfg.end, t);
        p.y -= Math.sin(t * Math.PI) * cfg.sag;
        pts.push(p);
      }
      const tube = MeshBuilder.CreateTube(
        `CourtyardCable_${c}`,
        { path: pts, radius: 0.022, tessellation: 6 },
        scene
      );
      tube.material = wroughtIronMat;
      tube.parent = root;
      swayingCables.push(tube);
    }

    // --- 6. ALLEY NEON SIGN & COURTYARD JUNCTION BREAKER BOX ---
    const neonMat = new StandardMaterial('alleyNeonMat', scene);
    neonMat.emissiveColor = new Color3(0.95, 0.28, 0.18);
    neonMat.diffuseColor = new Color3(0.2, 0.05, 0.05);

    const neonSignBacking = MeshBuilder.CreateBox(
      'AlleyNeonBacking',
      { width: 0.45, height: 3.4, depth: 0.18 },
      scene
    );
    neonSignBacking.position.set(8.6, 6.4, -1.1);
    neonSignBacking.material = wroughtIronMat;
    neonSignBacking.parent = root;

    const neonTube = MeshBuilder.CreateBox(
      'AlleyNeonTube',
      { width: 0.12, height: 3.1, depth: 0.22 },
      scene
    );
    neonTube.position.set(8.35, 6.4, -1.1);
    neonTube.material = neonMat;
    neonTube.parent = root;

    // Foreground Observer Window Sill Framing (at Z = -16.6, Y = 7.2)
    const observerLedge = MeshBuilder.CreateBox(
      'ObserverWindowSill',
      { width: 6.5, height: 0.18, depth: 0.8 },
      scene
    );
    observerLedge.position.set(0, 7.15, -16.6);
    observerLedge.material = wetConcreteMat;
    observerLedge.parent = root;

    // Suppress unused variable warning for glbTemplateRoot
    if (glbTemplateRoot) {
      glbTemplateRoot.parent = root;
    }

    return {
      root,
      windowNodes,
      swayingCables,
      spinningFans,
    };
  }
}
