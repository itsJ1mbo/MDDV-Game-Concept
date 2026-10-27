export interface PlayerMovementInput {
  readonly moveX: number; // -1 (left), 0, +1 (right)
  readonly jump: boolean;
}

export type FacingDirection = 'left' | 'right';

export interface PlatformBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PlayerStateSnapshot {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly width: number;
  readonly height: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly isGrounded: boolean;
  readonly isStaggered: boolean;
  readonly staggerTimeRemainingMs: number;
  readonly isDead: boolean;
  readonly facingDirection: FacingDirection;
}
