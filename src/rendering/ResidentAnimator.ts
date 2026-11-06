import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { RESIDENT_LIST } from '../data/residents';
import { ActiveResidentState } from '../simulation/SimulationEngine';
import { ApartmentId, ResidentId } from '../types/game';
import { ApartmentInteriorNodes } from './InteriorBuilder';

export interface ArticulatedResidentRig {
  residentId: ResidentId;
  rootNode: TransformNode;
  torsoMesh: Mesh;
  headMesh: Mesh;
  leftArmPivot: TransformNode;
  rightArmPivot: TransformNode;
  leftLegPivot: TransformNode;
  rightLegPivot: TransformNode;
  carriedCaseMesh: Mesh;
  allMeshes: Mesh[];
}

function hexToColor3(hex: string): Color3 {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return new Color3(r, g, b);
}

export class ResidentAnimator {
  public static async buildResidentRigs(
    scene: Scene,
    interiors: Record<ApartmentId, ApartmentInteriorNodes>
  ): Promise<Record<ResidentId, ArticulatedResidentRig>> {
    const rigs = {} as Record<ResidentId, ArticulatedResidentRig>;

    try {
      const loaded = await SceneLoader.ImportMeshAsync(
        '',
        '/assets/models/',
        'resident_rig.glb',
        scene
      );
      for (const m of loaded.meshes) {
        m.setEnabled(false);
      }
    } catch {
      // Fallback in headless unit environment
    }

    const skinMat = new PBRMaterial('residentSkinMat', scene);
    skinMat.albedoColor = new Color3(0.84, 0.7, 0.58);
    skinMat.emissiveColor = new Color3(0.22, 0.16, 0.12);
    skinMat.metallic = 0.02;
    skinMat.roughness = 0.65;
    skinMat.maxSimultaneousLights = 4;

    const crimsonCaseMat = new PBRMaterial('carriedCaseMat', scene);
    crimsonCaseMat.albedoColor = new Color3(0.82, 0.14, 0.16);
    crimsonCaseMat.emissiveColor = new Color3(0.28, 0.04, 0.05);
    crimsonCaseMat.metallic = 0.15;
    crimsonCaseMat.roughness = 0.35;
    crimsonCaseMat.maxSimultaneousLights = 4;

    for (const res of RESIDENT_LIST) {
      const rootNode = new TransformNode(`Resident_${res.id}`, scene);

      const coatMat = new PBRMaterial(`CoatMat_${res.id}`, scene);
      coatMat.albedoColor = hexToColor3(res.coatColor);
      coatMat.emissiveColor = hexToColor3(res.accentColor).scale(0.28);
      coatMat.metallic = 0.08;
      coatMat.roughness = 0.72;
      coatMat.maxSimultaneousLights = 4;

      const trouserMat = new PBRMaterial(`TrouserMat_${res.id}`, scene);
      trouserMat.albedoColor = new Color3(0.18, 0.21, 0.27);
      trouserMat.emissiveColor = new Color3(0.05, 0.06, 0.09);
      trouserMat.metallic = 0.05;
      trouserMat.roughness = 0.78;
      trouserMat.maxSimultaneousLights = 4;

      // Torso & Collar
      const torsoMesh = MeshBuilder.CreateBox(
        `${res.id}_Torso`,
        { width: 0.44, height: 0.62, depth: 0.24 },
        scene
      );
      torsoMesh.position.set(0, 1.12, 0);
      torsoMesh.material = coatMat;
      torsoMesh.parent = rootNode;

      // Head & Noir Silhouette Hat/Hair
      const headMesh = MeshBuilder.CreateSphere(
        `${res.id}_Head`,
        { diameter: 0.27, segments: 12 },
        scene
      );
      headMesh.position.set(0, 1.6, 0);
      headMesh.material = skinMat;
      headMesh.parent = rootNode;

      // Left & Right Articulated Arms
      const leftArmPivot = new TransformNode(`${res.id}_LeftArmPivot`, scene);
      leftArmPivot.position.set(-0.29, 1.36, 0);
      leftArmPivot.parent = rootNode;

      const leftArmMesh = MeshBuilder.CreateBox(
        `${res.id}_LeftArm`,
        { width: 0.13, height: 0.56, depth: 0.13 },
        scene
      );
      leftArmMesh.position.set(0, -0.24, 0);
      leftArmMesh.material = coatMat;
      leftArmMesh.parent = leftArmPivot;

      const rightArmPivot = new TransformNode(`${res.id}_RightArmPivot`, scene);
      rightArmPivot.position.set(0.29, 1.36, 0);
      rightArmPivot.parent = rootNode;

      const rightArmMesh = MeshBuilder.CreateBox(
        `${res.id}_RightArm`,
        { width: 0.13, height: 0.56, depth: 0.13 },
        scene
      );
      rightArmMesh.position.set(0, -0.24, 0);
      rightArmMesh.material = coatMat;
      rightArmMesh.parent = rightArmPivot;

      // Left & Right Articulated Legs
      const leftLegPivot = new TransformNode(`${res.id}_LeftLegPivot`, scene);
      leftLegPivot.position.set(-0.12, 0.8, 0);
      leftLegPivot.parent = rootNode;

      const leftLegMesh = MeshBuilder.CreateBox(
        `${res.id}_LeftLeg`,
        { width: 0.16, height: 0.78, depth: 0.16 },
        scene
      );
      leftLegMesh.position.set(0, -0.39, 0);
      leftLegMesh.material = trouserMat;
      leftLegMesh.parent = leftLegPivot;

      const rightLegPivot = new TransformNode(`${res.id}_RightLegPivot`, scene);
      rightLegPivot.position.set(0.12, 0.8, 0);
      rightLegPivot.parent = rootNode;

      const rightLegMesh = MeshBuilder.CreateBox(
        `${res.id}_RightLeg`,
        { width: 0.16, height: 0.78, depth: 0.16 },
        scene
      );
      rightLegMesh.position.set(0, -0.39, 0);
      rightLegMesh.material = trouserMat;
      rightLegMesh.parent = rightLegPivot;

      // Handheld Crimson Violin Case (enabled when posture === 'carrying_case')
      const carriedCaseMesh = MeshBuilder.CreateBox(
        `${res.id}_CarriedViolinCase`,
        { width: 0.14, height: 0.28, depth: 0.72 },
        scene
      );
      carriedCaseMesh.position.set(0.12, -0.45, 0.22);
      carriedCaseMesh.material = crimsonCaseMat;
      carriedCaseMesh.parent = rightArmPivot;
      carriedCaseMesh.setEnabled(false);

      const allMeshes = [
        torsoMesh,
        headMesh,
        leftArmMesh,
        rightArmMesh,
        leftLegMesh,
        rightLegMesh,
        carriedCaseMesh,
      ];

      // Register resident meshes with all interactive apartment shadow generators
      for (const interior of Object.values(interiors)) {
        if (interior.shadowGenerator) {
          for (const m of allMeshes) {
            interior.shadowGenerator.addShadowCaster(m);
          }
        }
      }

      rigs[res.id] = {
        residentId: res.id,
        rootNode,
        torsoMesh,
        headMesh,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
        carriedCaseMesh,
        allMeshes,
      };
    }

    return rigs;
  }

  public static updateResidents(
    rigs: Record<ResidentId, ArticulatedResidentRig>,
    states: Record<ResidentId, ActiveResidentState>,
    elapsedTimeSec: number,
    deltaSec: number
  ): void {
    for (const resId of Object.keys(rigs) as ResidentId[]) {
      const rig = rigs[resId];
      const st = states[resId];
      if (!st) continue;

      const targetPos = new Vector3(
        st.worldPosition[0],
        st.worldPosition[1],
        st.worldPosition[2]
      );

      // Smoothly interpolate position unless jumping between apartments
      const dist = Vector3.Distance(rig.rootNode.position, targetPos);
      if (dist > 3.2 || deltaSec <= 0) {
        rig.rootNode.position.copyFrom(targetPos);
      } else {
        Vector3.LerpToRef(
          rig.rootNode.position,
          targetPos,
          Math.min(1, deltaSec * 6.5),
          rig.rootNode.position
        );
      }

      rig.rootNode.rotation.y = st.facingYaw;

      // Animate limbs based on posture
      const t = elapsedTimeSec * 3.8;
      rig.carriedCaseMesh.setEnabled(st.posture === 'carrying_case');

      switch (st.posture) {
        case 'working_desk':
          rig.leftArmPivot.rotation.x = -0.65 + Math.sin(t * 1.4) * 0.16;
          rig.rightArmPivot.rotation.x = -0.75 + Math.cos(t * 1.7) * 0.22;
          rig.leftLegPivot.rotation.x = 0;
          rig.rightLegPivot.rotation.x = 0;
          rig.headMesh.rotation.x = 0.22;
          break;

        case 'pacing_nervously':
          rig.leftArmPivot.rotation.x = Math.sin(t * 1.8) * 0.45;
          rig.rightArmPivot.rotation.x = -Math.sin(t * 1.8) * 0.45;
          rig.leftLegPivot.rotation.x = -Math.sin(t * 1.8) * 0.52;
          rig.rightLegPivot.rotation.x = Math.sin(t * 1.8) * 0.52;
          rig.headMesh.rotation.y = Math.sin(t * 0.9) * 0.25;
          break;

        case 'searching_cabinet':
        case 'inspecting_fusebox':
          rig.leftArmPivot.rotation.x = -1.05 + Math.sin(t * 2.1) * 0.25;
          rig.rightArmPivot.rotation.x = -1.15 - Math.sin(t * 2.1) * 0.25;
          rig.leftLegPivot.rotation.x = 0;
          rig.rightLegPivot.rotation.x = 0;
          rig.headMesh.rotation.x = -0.1 + Math.sin(t) * 0.12;
          break;

        case 'looking_out_window':
          rig.leftArmPivot.rotation.x = -0.25;
          rig.rightArmPivot.rotation.x = -0.95; // holding pocket watch / camera / blinds
          rig.leftLegPivot.rotation.x = 0;
          rig.rightLegPivot.rotation.x = 0;
          rig.headMesh.rotation.y = Math.sin(t * 0.45) * 0.18;
          break;

        case 'carrying_case':
          rig.leftArmPivot.rotation.x = Math.sin(t * 1.3) * 0.25;
          rig.rightArmPivot.rotation.x = -0.35;
          rig.leftLegPivot.rotation.x = Math.sin(t * 1.3) * 0.3;
          rig.rightLegPivot.rotation.x = -Math.sin(t * 1.3) * 0.3;
          break;

        case 'making_phone_call':
          rig.leftArmPivot.rotation.x = -0.15;
          rig.rightArmPivot.rotation.x = -1.85; // Handset to ear
          rig.headMesh.rotation.z = 0.12;
          break;

        default:
          rig.leftArmPivot.rotation.x = Math.sin(t * 0.5) * 0.08;
          rig.rightArmPivot.rotation.x = -Math.sin(t * 0.5) * 0.08;
          rig.leftLegPivot.rotation.x = 0;
          rig.rightLegPivot.rotation.x = 0;
          break;
      }
    }
  }
}
