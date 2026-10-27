import { PlayerMovementInput } from '../../domain/player/PlayerTypes';

export interface ActionInputSnapshot extends PlayerMovementInput {
  readonly requestBeamLeft: boolean;
  readonly requestBeamRight: boolean;
  readonly requestRest: boolean;
  readonly togglePause: boolean;
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private mouseButtons: [boolean, boolean, boolean] = [false, false, false];
  private pausePressedThisFrame = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pausePressedThisFrame = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button >= 0 && e.button <= 2) {
        this.mouseButtons[e.button] = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button >= 0 && e.button <= 2) {
        this.mouseButtons[e.button] = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent browser context menu on right click so right click can be used for right lantern
      e.preventDefault();
    });
  }

  public getSnapshot(): ActionInputSnapshot {
    let moveX = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const jump = Boolean(
      this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']
    );

    // Left Lantern: Key J, Key Z, or Left Mouse
    const requestBeamLeft = Boolean(
      this.keys['KeyJ'] || this.keys['KeyZ'] || this.mouseButtons[0]
    );

    // Right Lantern: Key K, Key X, or Right Mouse
    const requestBeamRight = Boolean(
      this.keys['KeyK'] || this.keys['KeyX'] || this.mouseButtons[2]
    );

    // Rest at checkpoint: Key E, Key S, or Down Arrow
    const requestRest = Boolean(
      this.keys['KeyE'] || this.keys['KeyS'] || this.keys['ArrowDown']
    );

    const togglePause = this.pausePressedThisFrame;
    this.pausePressedThisFrame = false;

    return {
      moveX,
      jump,
      requestBeamLeft,
      requestBeamRight,
      requestRest,
      togglePause,
    };
  }

  public destroy(): void {
    // Listeners are bound to window; can reset key maps
    this.keys = {};
    this.mouseButtons = [false, false, false];
  }
}
