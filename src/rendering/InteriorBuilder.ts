import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  Scene,
  SceneLoader,
  ShadowGenerator,
  SpotLight,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { APARTMENT_LIST } from '../data/apartments';
import { ApartmentId } from '../types/game';
import { ProceduralTextures } from './ProceduralTextures';

export interface ApartmentInteriorNodes {
  apartmentId: ApartmentId;
  roomRoot: TransformNode;
  keyLight?: PointLight;
  spotLight?: SpotLight;
  shadowGenerator?: ShadowGenerator;
  wallMaterial: PBRMaterial;
  lampBulbMat: StandardMaterial;
  propMeshes: Record<string, TransformNode>;
}

function hexToColor3(hex: string): Color3 {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return new Color3(r, g, b);
}

export class InteriorBuilder {
  public static async buildAllInteriors(
    scene: Scene
  ): Promise<Record<ApartmentId, ApartmentInteriorNodes>> {
    const interiors = {} as Record<ApartmentId, ApartmentInteriorNodes>;

    // Load furniture kit GLB
    try {
      const loaded = await SceneLoader.ImportMeshAsync(
        '',
        '/assets/models/',
        'furniture_kit.glb',
        scene
      );
      for (const m of loaded.meshes) {
        m.setEnabled(false);
      }
    } catch {
      // Fallback in headless unit environment
    }

    // Shared interior PBR materials with maxSimultaneousLights = 4 (keeps vertex UBOs <= 8)
    const mahoganyMat = new PBRMaterial('mahoganyMat', scene);
    mahoganyMat.albedoColor = new Color3(0.48, 0.26, 0.14);
    mahoganyMat.emissiveColor = new Color3(0.18, 0.09, 0.04);
    mahoganyMat.metallic = 0.06;
    mahoganyMat.roughness = 0.42;
    mahoganyMat.maxSimultaneousLights = 4;

    const oakFloorMat = new PBRMaterial('oakFloorMat', scene);
    oakFloorMat.albedoColor = new Color3(0.38, 0.26, 0.16);
    oakFloorMat.emissiveColor = new Color3(0.14, 0.09, 0.05);
    oakFloorMat.metallic = 0.05;
    oakFloorMat.roughness = 0.48;
    oakFloorMat.maxSimultaneousLights = 4;

    const brassMat = new PBRMaterial('brassMat', scene);
    brassMat.albedoColor = new Color3(0.9, 0.72, 0.34);
    brassMat.emissiveColor = new Color3(0.32, 0.24, 0.08);
    brassMat.metallic = 0.85;
    brassMat.roughness = 0.24;
    brassMat.maxSimultaneousLights = 4;

    const darkSteelMat = new PBRMaterial('darkSteelMat', scene);
    darkSteelMat.albedoColor = new Color3(0.34, 0.39, 0.46);
    darkSteelMat.emissiveColor = new Color3(0.1, 0.12, 0.16);
    darkSteelMat.metallic = 0.72;
    darkSteelMat.roughness = 0.38;
    darkSteelMat.maxSimultaneousLights = 4;

    const crimsonCaseMat = new PBRMaterial('crimsonCaseMat', scene);
    crimsonCaseMat.albedoColor = new Color3(0.86, 0.16, 0.18);
    crimsonCaseMat.emissiveColor = new Color3(0.38, 0.06, 0.07);
    crimsonCaseMat.metallic = 0.15;
    crimsonCaseMat.roughness = 0.35;
    crimsonCaseMat.maxSimultaneousLights = 4;

    const emeraldShadeMat = new StandardMaterial('emeraldShadeMat', scene);
    emeraldShadeMat.diffuseColor = new Color3(0.18, 0.78, 0.56);
    emeraldShadeMat.emissiveColor = new Color3(0.18, 0.65, 0.45);

    const yellowPaperMat = new StandardMaterial('yellowPaperMat', scene);
    yellowPaperMat.diffuseColor = new Color3(0.98, 0.88, 0.34);
    yellowPaperMat.emissiveColor = new Color3(0.52, 0.42, 0.12);

    for (const apt of APARTMENT_LIST) {
      const roomRoot = new TransformNode(`Room_${apt.code}`, scene);
      roomRoot.position.set(apt.worldCenter[0], apt.worldCenter[1], apt.worldCenter[2]);

      const roomW = 3.8;
      const roomH = 2.85;
      const roomD = 4.2;

      // Baked indirect lightmap + wallpaper texture specific to this room's palette
      const wallTex = ProceduralTextures.createInteriorWallpaperAndLightmap(
        scene,
        `WallTex_${apt.code}`,
        apt.isDetailedInteractive ? '#353d4b' : '#252c38',
        apt.themeColorHex
      );

      const themeColor = hexToColor3(apt.themeColorHex);
      const wallMat = new PBRMaterial(`WallMat_${apt.code}`, scene);
      wallMat.albedoTexture = wallTex;
      wallMat.emissiveTexture = wallTex;
      wallMat.emissiveColor = themeColor.scale(apt.isDetailedInteractive ? 0.78 : 0.48);
      wallMat.emissiveIntensity = apt.isDetailedInteractive ? 0.65 : 0.38;
      wallMat.metallic = 0.02;
      wallMat.roughness = 0.8;
      wallMat.maxSimultaneousLights = 4;

      // Room Shell (Back Wall, Left Wall, Right Wall, Floor, Ceiling)
      const backWall = MeshBuilder.CreateBox(
        `BackWall_${apt.code}`,
        { width: roomW, height: roomH, depth: 0.12 },
        scene
      );
      backWall.position.set(0, 0, roomD * 0.5);
      backWall.material = wallMat;
      backWall.receiveShadows = true;
      backWall.parent = roomRoot;

      const leftWall = MeshBuilder.CreateBox(
        `LeftWall_${apt.code}`,
        { width: 0.12, height: roomH, depth: roomD },
        scene
      );
      leftWall.position.set(-roomW * 0.5, 0, 0);
      leftWall.material = wallMat;
      leftWall.receiveShadows = true;
      leftWall.parent = roomRoot;

      const rightWall = MeshBuilder.CreateBox(
        `RightWall_${apt.code}`,
        { width: 0.12, height: roomH, depth: roomD },
        scene
      );
      rightWall.position.set(roomW * 0.5, 0, 0);
      rightWall.material = wallMat;
      rightWall.receiveShadows = true;
      rightWall.parent = roomRoot;

      const floor = MeshBuilder.CreateBox(
        `Floor_${apt.code}`,
        { width: roomW, height: 0.12, depth: roomD },
        scene
      );
      floor.position.set(0, -roomH * 0.5, 0);
      floor.material = oakFloorMat;
      floor.receiveShadows = true;
      floor.parent = roomRoot;

      const ceiling = MeshBuilder.CreateBox(
        `Ceiling_${apt.code}`,
        { width: roomW, height: 0.12, depth: roomD },
        scene
      );
      ceiling.position.set(0, roomH * 0.5, 0);
      ceiling.material = wallMat;
      ceiling.parent = roomRoot;

      // Ceiling Pendant Fixture & Glowing Bulb
      const lampCord = MeshBuilder.CreateCylinder(
        `LampCord_${apt.code}`,
        { diameter: 0.02, height: 0.55 },
        scene
      );
      lampCord.position.set(0, roomH * 0.5 - 0.28, -0.2);
      lampCord.material = darkSteelMat;
      lampCord.parent = roomRoot;

      const lampBulbMat = new StandardMaterial(`LampBulbMat_${apt.code}`, scene);
      lampBulbMat.emissiveColor = themeColor;
      lampBulbMat.diffuseColor = themeColor;

      const lampShade = MeshBuilder.CreateCylinder(
        `LampShade_${apt.code}`,
        { diameterTop: 0.12, diameterBottom: 0.42, height: 0.2 },
        scene
      );
      lampShade.position.set(0, roomH * 0.5 - 0.55, -0.2);
      lampShade.material = lampBulbMat;
      lampShade.parent = roomRoot;

      // Selective Dynamic Interior Lighting ONLY on the 4 detailed apartments
      // (keeps total active lights in scene <= 8 for WebGPU/WebGL2 uniform buffer limits)
      let keyLight: PointLight | undefined;
      let spotLight: SpotLight | undefined;
      let shadowGenerator: ShadowGenerator | undefined;

      if (apt.isDetailedInteractive) {
        keyLight = new PointLight(
          `RoomLight_${apt.code}`,
          new Vector3(apt.worldCenter[0], apt.worldCenter[1] + 0.75, apt.worldCenter[2] - 0.25),
          scene
        );
        keyLight.diffuse = themeColor;
        keyLight.specular = themeColor.scale(0.6);
        keyLight.intensity = apt.baseLightIntensity * 1.45;
        keyLight.range = 8.5;
      }

      const propMeshes: Record<string, TransformNode> = {};

      // --- POPULATE APARTMENT-SPECIFIC INTERIOR ARCHITECTURE & PROPS ---
      if (apt.id === 'apt_4a') {
        const bench = MeshBuilder.CreateBox(
          '4A_Workbench',
          { width: 1.65, height: 0.82, depth: 0.75 },
          scene
        );
        bench.position.set(-0.72, -0.98, 0.25);
        bench.material = mahoganyMat;
        bench.parent = roomRoot;
        shadowGenerator?.addShadowCaster(bench);

        for (let vx = -1.1; vx <= -0.1; vx += 0.5) {
          const vBody = MeshBuilder.CreateCylinder(
            `4A_WallViolin_${vx}`,
            { diameter: 0.28, height: 0.06, tessellation: 12 },
            scene
          );
          vBody.rotation.x = Math.PI / 2;
          vBody.position.set(vx, 0.35, 1.98);
          vBody.material = mahoganyMat;
          vBody.parent = roomRoot;
        }

        const safeBox = MeshBuilder.CreateBox(
          '4A_WallSafe',
          { width: 0.65, height: 0.65, depth: 0.25 },
          scene
        );
        safeBox.position.set(1.05, 0.15, 1.95);
        safeBox.material = darkSteelMat;
        safeBox.parent = roomRoot;

        const safeDial = MeshBuilder.CreateCylinder(
          '4A_SafeDial',
          { diameter: 0.16, height: 0.08 },
          scene
        );
        safeDial.rotation.x = Math.PI / 2;
        safeDial.position.set(1.05, 0.15, 1.81);
        safeDial.material = brassMat;
        safeDial.parent = roomRoot;

        const violinBenchProp = new TransformNode('prop_violin_workbench', scene);
        violinBenchProp.parent = roomRoot;
        const caseMesh = MeshBuilder.CreateBox(
          '4A_ViolinCaseBench',
          { width: 0.75, height: 0.14, depth: 0.28 },
          scene
        );
        caseMesh.position.set(-0.72, -0.5, 0.25);
        caseMesh.material = crimsonCaseMat;
        caseMesh.parent = violinBenchProp;
        propMeshes['prop_violin_workbench'] = violinBenchProp;

        const safeOpenProp = new TransformNode('prop_safe_open', scene);
        safeOpenProp.parent = roomRoot;
        const safeCase = MeshBuilder.CreateBox(
          '4A_SafeCase',
          { width: 0.52, height: 0.14, depth: 0.22 },
          scene
        );
        safeCase.position.set(1.05, 0.15, 1.78);
        safeCase.material = crimsonCaseMat;
        safeCase.parent = safeOpenProp;
        propMeshes['prop_safe_open'] = safeOpenProp;
      } else if (apt.id === 'apt_3b') {
        const desk = MeshBuilder.CreateBox(
          '3B_ArchivistDesk',
          { width: 1.5, height: 0.78, depth: 0.75 },
          scene
        );
        desk.position.set(0.65, -1.0, 0.2);
        desk.material = mahoganyMat;
        desk.parent = roomRoot;
        shadowGenerator?.addShadowCaster(desk);

        const bankerLamp = MeshBuilder.CreateBox(
          '3B_BankerLamp',
          { width: 0.28, height: 0.16, depth: 0.18 },
          scene
        );
        bankerLamp.position.set(0.55, -0.42, 0.15);
        bankerLamp.material = emeraldShadeMat;
        bankerLamp.parent = roomRoot;

        const shelf = MeshBuilder.CreateBox(
          '3B_Bookshelf',
          { width: 0.45, height: 2.35, depth: 1.8 },
          scene
        );
        shelf.position.set(-1.58, -0.2, 0.65);
        shelf.material = mahoganyMat;
        shelf.parent = roomRoot;
        shadowGenerator?.addShadowCaster(shelf);

        const tripodPole = MeshBuilder.CreateCylinder(
          '3B_CameraTripod',
          { diameter: 0.06, height: 1.35 },
          scene
        );
        tripodPole.position.set(-0.45, -0.72, -0.85);
        tripodPole.material = darkSteelMat;
        tripodPole.parent = roomRoot;

        const cameraBody = MeshBuilder.CreateBox(
          '3B_CameraSLR',
          { width: 0.22, height: 0.18, depth: 0.36 },
          scene
        );
        cameraBody.position.set(-0.45, 0.02, -0.88);
        cameraBody.material = brassMat;
        cameraBody.parent = roomRoot;

        const board = MeshBuilder.CreateBox(
          '3B_EvidenceBoard',
          { width: 1.65, height: 1.05, depth: 0.06 },
          scene
        );
        board.position.set(0.35, 0.35, 1.98);
        board.material = yellowPaperMat;
        board.parent = roomRoot;

        const receiptProp = new TransformNode('prop_custody_receipt', scene);
        receiptProp.parent = roomRoot;
        const vaultBundle = MeshBuilder.CreateBox(
          '3B_VaultViolinBundle',
          { width: 0.32, height: 0.22, depth: 0.72 },
          scene
        );
        vaultBundle.position.set(-1.25, 0.15, 0.75);
        vaultBundle.material = crimsonCaseMat;
        vaultBundle.parent = receiptProp;
        propMeshes['prop_custody_receipt'] = receiptProp;

        const ledgerSignalProp = new TransformNode('prop_window_ledger_display', scene);
        ledgerSignalProp.parent = roomRoot;
        const chartSheet = MeshBuilder.CreateBox(
          '3B_WindowLedgerChart',
          { width: 0.85, height: 0.62, depth: 0.03 },
          scene
        );
        chartSheet.position.set(0.0, 0.15, -1.05);
        chartSheet.material = yellowPaperMat;
        chartSheet.parent = ledgerSignalProp;
        propMeshes['prop_window_ledger_display'] = ledgerSignalProp;
      } else if (apt.id === 'apt_2c') {
        const table = MeshBuilder.CreateBox(
          '2C_ManifestTable',
          { width: 1.35, height: 0.76, depth: 0.85 },
          scene
        );
        table.position.set(-0.55, -1.02, 0.15);
        table.material = mahoganyMat;
        table.parent = roomRoot;
        shadowGenerator?.addShadowCaster(table);

        const galley = MeshBuilder.CreateBox(
          '2C_GalleyCounter',
          { width: 0.65, height: 0.9, depth: 1.75 },
          scene
        );
        galley.position.set(1.45, -0.95, 0.55);
        galley.material = darkSteelMat;
        galley.parent = roomRoot;

        const ventGrille = MeshBuilder.CreateBox(
          '2C_FalseWallVent',
          { width: 0.75, height: 0.52, depth: 0.08 },
          scene
        );
        ventGrille.position.set(-1.15, -0.65, 1.98);
        ventGrille.material = brassMat;
        ventGrille.parent = roomRoot;

        const manifestProp = new TransformNode('prop_forged_manifest', scene);
        manifestProp.parent = roomRoot;
        const manifestSheet = MeshBuilder.CreateBox(
          '2C_ManifestDoc',
          { width: 0.55, height: 0.04, depth: 0.42 },
          scene
        );
        manifestSheet.position.set(-0.55, -0.61, 0.15);
        manifestSheet.material = yellowPaperMat;
        manifestSheet.parent = manifestProp;
        propMeshes['prop_forged_manifest'] = manifestProp;

        const stolenCaseProp = new TransformNode('prop_stolen_case_2c', scene);
        stolenCaseProp.parent = roomRoot;
        const stolenCaseMesh = MeshBuilder.CreateBox(
          '2C_StolenViolinCase',
          { width: 0.76, height: 0.16, depth: 0.3 },
          scene
        );
        stolenCaseMesh.position.set(-0.95, -0.55, 1.45);
        stolenCaseMesh.material = crimsonCaseMat;
        stolenCaseMesh.parent = stolenCaseProp;
        propMeshes['prop_stolen_case_2c'] = stolenCaseProp;

        const keytagProp = new TransformNode('prop_dropped_keytag', scene);
        keytagProp.parent = roomRoot;
        const keytagMesh = MeshBuilder.CreateBox(
          '2C_DroppedKeytag',
          { width: 0.28, height: 0.08, depth: 0.18 },
          scene
        );
        keytagMesh.position.set(0.0, -0.85, -0.85);
        keytagMesh.material = brassMat;
        keytagMesh.parent = keytagProp;
        propMeshes['prop_dropped_keytag'] = keytagProp;
      } else if (apt.id === 'apt_1a') {
        const counter = MeshBuilder.CreateBox(
          '1A_KitchenCounter',
          { width: 1.55, height: 0.85, depth: 0.72 },
          scene
        );
        counter.position.set(0.45, -0.98, 0.15);
        counter.material = darkSteelMat;
        counter.parent = roomRoot;
        shadowGenerator?.addShadowCaster(counter);

        const fusePanel = MeshBuilder.CreateBox(
          '1A_MasterBreakerBox',
          { width: 0.18, height: 1.15, depth: 0.78 },
          scene
        );
        fusePanel.position.set(-1.75, 0.15, 0.75);
        fusePanel.material = darkSteelMat;
        fusePanel.parent = roomRoot;

        const redRelaySwitch = MeshBuilder.CreateBox(
          '1A_RedRelaySwitch',
          { width: 0.08, height: 0.18, depth: 0.18 },
          scene
        );
        redRelaySwitch.position.set(-1.62, 0.25, 0.75);
        redRelaySwitch.material = crimsonCaseMat;
        redRelaySwitch.parent = roomRoot;

        const keyBoard = MeshBuilder.CreateBox(
          '1A_MasterKeyRack',
          { width: 0.95, height: 0.68, depth: 0.08 },
          scene
        );
        keyBoard.position.set(0.75, 0.35, 1.98);
        keyBoard.material = mahoganyMat;
        keyBoard.parent = roomRoot;

        const extortionProp = new TransformNode('prop_extortion_note_1a', scene);
        extortionProp.parent = roomRoot;
        const yellowNote = MeshBuilder.CreateBox(
          '1A_YellowExtortionNote',
          { width: 0.46, height: 0.04, depth: 0.34 },
          scene
        );
        yellowNote.position.set(0.45, -0.52, 0.15);
        yellowNote.material = yellowPaperMat;
        yellowNote.parent = extortionProp;
        propMeshes['prop_extortion_note_1a'] = extortionProp;
      } else {
        if (apt.id === 'apt_3c') {
          const payphoneBox = MeshBuilder.CreateBox(
            '3C_RotaryPayphone',
            { width: 0.38, height: 0.58, depth: 0.24 },
            scene
          );
          payphoneBox.position.set(0.75, 0.15, 1.85);
          payphoneBox.material = brassMat;
          payphoneBox.parent = roomRoot;

          const stairFlight = MeshBuilder.CreateBox(
            '3C_StairBanister',
            { width: 2.2, height: 0.18, depth: 0.95 },
            scene
          );
          stairFlight.rotation.z = 0.42;
          stairFlight.position.set(-0.4, -0.35, 1.1);
          stairFlight.material = mahoganyMat;
          stairFlight.parent = roomRoot;
        } else if (apt.id === 'apt_2a') {
          const clothesline = MeshBuilder.CreateBox(
            '2A_FilmLine',
            { width: 2.4, height: 0.03, depth: 0.03 },
            scene
          );
          clothesline.position.set(0, 0.45, 0.2);
          clothesline.material = darkSteelMat;
          clothesline.parent = roomRoot;

          for (let px = -0.75; px <= 0.75; px += 0.5) {
            const print = MeshBuilder.CreateBox(
              `2A_PhotoPrint_${px}`,
              { width: 0.32, height: 0.42, depth: 0.02 },
              scene
            );
            print.position.set(px, 0.18, 0.2);
            print.material = yellowPaperMat;
            print.parent = roomRoot;
          }
        } else {
          const wardrobe = MeshBuilder.CreateBox(
            `SecCabinet_${apt.code}`,
            { width: 1.1, height: 1.85, depth: 0.55 },
            scene
          );
          wardrobe.position.set(-0.85, -0.45, 1.45);
          wardrobe.material = mahoganyMat;
          wardrobe.parent = roomRoot;

          const sideTable = MeshBuilder.CreateBox(
            `SecTable_${apt.code}`,
            { width: 0.95, height: 0.75, depth: 0.75 },
            scene
          );
          sideTable.position.set(0.65, -1.0, 0.55);
          sideTable.material = darkSteelMat;
          sideTable.parent = roomRoot;
        }
      }

      // Scope each apartment's keyLight strictly to the meshes inside that apartment room
      // so no material in the scene ever exceeds 3 lights (eliminates WebGL2/WebGPU UBO overflow)
      if (keyLight) {
        keyLight.includedOnlyMeshes = roomRoot.getChildMeshes(false);
      }

      interiors[apt.id] = {
        apartmentId: apt.id,
        roomRoot,
        keyLight,
        spotLight,
        shadowGenerator,
        wallMaterial: wallMat,
        lampBulbMat,
        propMeshes,
      };
    }

    return interiors;
  }
}
