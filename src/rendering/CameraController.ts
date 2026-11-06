import { Scene, UniversalCamera, Vector3 } from '@babylonjs/core';
import { APARTMENTS } from '../data/apartments';
import { useGameStore } from '../state/useGameStore';
import { ApartmentId } from '../types/game';

/**
 * Manages the Observer's tripod/handheld telephoto camera at 3rd-floor height across Mercer Courtyard.
 */
export class CameraController {
  public readonly camera: UniversalCamera;
  private currentLookAt = new Vector3(0, 8.0, 1.5);
  private targetLookAt = new Vector3(0, 8.0, 1.5);
  private manualPanOffset = new Vector3(0, 0, 0);
  private currentFov = 0.78;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new UniversalCamera('ObserverCamera', new Vector3(0, 8.4, -18.5), scene);
    this.camera.minZ = 0.2;
    this.camera.maxZ = 75.0;
    this.camera.fov = this.currentFov;
    this.camera.setTarget(this.currentLookAt);

    this.bindInputListeners(scene, canvas);
  }

  private bindInputListeners(scene: Scene, canvas: HTMLCanvasElement): void {
    // Mouse wheel optical zoom
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const store = useGameStore.getState();
        const delta = e.deltaY < 0 ? 0.22 : -0.22;
        store.setZoomLevel(store.zoomLevel + delta);
      },
      { passive: false }
    );

    // Pointer hover & click on window hitboxes
    scene.onPointerMove = () => {
      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => Boolean(mesh.metadata && mesh.metadata.apartmentId)
      );
      const hoveredId = (pick?.pickedMesh?.metadata?.apartmentId as ApartmentId) || null;
      if (useGameStore.getState().hoveredApartmentId !== hoveredId) {
        useGameStore.getState().setHoveredApartment(hoveredId);
      }
    };

    scene.onPointerDown = (evt) => {
      if (evt.button !== 0) return;
      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => Boolean(mesh.metadata && mesh.metadata.apartmentId)
      );
      const clickedAptId = (pick?.pickedMesh?.metadata?.apartmentId as ApartmentId) || null;
      if (clickedAptId) {
        this.manualPanOffset.set(0, 0, 0);
        useGameStore.getState().focusApartment(clickedAptId);
      }
    };

    // Keyboard controls for pan, zoom, focus ring, and quick apartment selection
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const store = useGameStore.getState();

      switch (e.key.toLowerCase()) {
        case 'escape':
          if (store.gameplayMode !== 'observing') {
            store.setGameplayMode('observing');
          } else {
            this.manualPanOffset.set(0, 0, 0);
            store.focusApartment(null);
          }
          break;
        case ' ':
          e.preventDefault();
          store.togglePause();
          break;
        case 'w':
        case 'arrowup':
          this.manualPanOffset.y = Math.min(5.5, this.manualPanOffset.y + 0.65);
          break;
        case 's':
        case 'arrowdown':
          this.manualPanOffset.y = Math.max(-5.5, this.manualPanOffset.y - 0.65);
          break;
        case 'a':
        case 'arrowleft':
          this.manualPanOffset.x = Math.max(-6.5, this.manualPanOffset.x - 0.65);
          break;
        case 'd':
        case 'arrowright':
          this.manualPanOffset.x = Math.min(6.5, this.manualPanOffset.x + 0.65);
          break;
        case 'q':
        case '[':
          store.setFocalDistance(store.focalDistance - 0.5);
          break;
        case 'e':
        case ']':
          store.setFocalDistance(store.focalDistance + 0.5);
          break;
        case 'f':
          store.toggleAutoFocus();
          break;
        case 'j':
          store.setGameplayMode(
            store.gameplayMode === 'journal_open' ? 'observing' : 'journal_open'
          );
          break;
        case 'b':
          store.setGameplayMode(
            store.gameplayMode === 'deduction_open' ? 'observing' : 'deduction_open'
          );
          break;
        case '1':
          this.manualPanOffset.set(0, 0, 0);
          store.focusApartment('apt_4a');
          break;
        case '2':
          this.manualPanOffset.set(0, 0, 0);
          store.focusApartment('apt_3b');
          break;
        case '3':
          this.manualPanOffset.set(0, 0, 0);
          store.focusApartment('apt_2c');
          break;
        case '4':
          this.manualPanOffset.set(0, 0, 0);
          store.focusApartment('apt_1a');
          break;
      }
    });
  }

  public update(deltaSec: number, elapsedSec: number): void {
    const store = useGameStore.getState();

    if (store.focusedApartmentId) {
      const apt = APARTMENTS[store.focusedApartmentId];
      this.targetLookAt.set(
        apt.worldCenter[0] + this.manualPanOffset.x,
        apt.worldCenter[1] - 0.15 + this.manualPanOffset.y,
        apt.worldCenter[2] - 0.4
      );
    } else {
      this.targetLookAt.set(
        0 + this.manualPanOffset.x,
        8.1 + this.manualPanOffset.y,
        1.2
      );
    }

    // Subtle handheld lens breathing when zoomed in (disabled if reducedMotion is enabled)
    if (!store.reducedMotion) {
      const swayAmp = store.zoomLevel > 1.5 ? 0.045 : 0.015;
      this.targetLookAt.x += Math.sin(elapsedSec * 1.1) * swayAmp;
      this.targetLookAt.y += Math.cos(elapsedSec * 0.85) * swayAmp;
    }

    Vector3.LerpToRef(
      this.currentLookAt,
      this.targetLookAt,
      Math.min(1, deltaSec * 6.5),
      this.currentLookAt
    );
    this.camera.setTarget(this.currentLookAt);

    // Map zoomLevel (1.0x -> 3.5x) to FOV (0.78 rad -> 0.21 rad)
    const desiredFov = 0.78 / Math.pow(store.zoomLevel, 0.92);
    this.currentFov += (desiredFov - this.currentFov) * Math.min(1, deltaSec * 8.0);
    this.camera.fov = this.currentFov;
  }
}
