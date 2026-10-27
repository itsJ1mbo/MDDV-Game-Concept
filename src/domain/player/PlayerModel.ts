import { PlayerTuning } from '../../config/GameConfig';
import { FacingDirection, PlatformBox, PlayerMovementInput, PlayerStateSnapshot } from './PlayerTypes';

export class PlayerModel {
  private x: number;
  private y: number;
  private vx = 0;
  private vy = 0;
  private lives: number;
  private staggerTimerMs = 0;
  private isGrounded = false;
  private facingDirection: FacingDirection = 'right';
  private dead = false;

  constructor(
    startX: number,
    startY: number,
    private readonly tuning: PlayerTuning
  ) {
    this.x = startX;
    this.y = startY;
    this.lives = tuning.maxLives;
  }

  public update(
    input: PlayerMovementInput,
    dtSeconds: number,
    platforms: readonly PlatformBox[] = []
  ): void {
    if (this.dead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    const dtMs = dtSeconds * 1000;
    if (this.staggerTimerMs > 0) {
      this.staggerTimerMs = Math.max(0, this.staggerTimerMs - dtMs);
    }

    const isStaggered = this.isStaggered();

    // 1. Horizontal movement
    if (!isStaggered) {
      const targetVx = input.moveX * this.tuning.moveSpeed;
      if (input.moveX !== 0) {
        this.facingDirection = input.moveX > 0 ? 'right' : 'left';
        if (Math.abs(this.vx) < Math.abs(targetVx) || Math.sign(this.vx) !== Math.sign(targetVx)) {
          const delta = this.tuning.acceleration * dtSeconds;
          if (this.vx < targetVx) {
            this.vx = Math.min(targetVx, this.vx + delta);
          } else {
            this.vx = Math.max(targetVx, this.vx - delta);
          }
        } else {
          this.vx = targetVx;
        }
      } else {
        const decel = this.tuning.deceleration * dtSeconds;
        if (this.vx > 0) {
          this.vx = Math.max(0, this.vx - decel);
        } else if (this.vx < 0) {
          this.vx = Math.min(0, this.vx + decel);
        }
      }

      // 2. Jumping
      if (input.jump && this.isGrounded) {
        this.vy = this.tuning.jumpVelocity;
        this.isGrounded = false;
      }
    } else {
      // During stagger, apply friction to knockback
      const friction = this.tuning.deceleration * 0.75 * dtSeconds;
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - friction);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + friction);
      }
    }

    // 3. Gravity
    this.vy += this.tuning.gravity * dtSeconds;

    // 4. Physics & Platform Collisions
    this.applyPhysicsAndCollisions(dtSeconds, platforms);
  }

  private applyPhysicsAndCollisions(dtSeconds: number, platforms: readonly PlatformBox[]): void {
    const halfW = this.tuning.width / 2;
    const halfH = this.tuning.height / 2;

    // Horizontal pass
    const nextX = this.x + this.vx * dtSeconds;
    let resolvedX = nextX;

    for (const p of platforms) {
      if (this.checkAABB(resolvedX, this.y, halfW, halfH, p)) {
        if (this.vx > 0) {
          resolvedX = p.x - halfW;
        } else if (this.vx < 0) {
          resolvedX = p.x + p.width + halfW;
        }
        this.vx = 0;
      }
    }
    this.x = resolvedX;

    // Vertical pass
    const nextY = this.y + this.vy * dtSeconds;
    let resolvedY = nextY;
    let groundedThisFrame = false;

    for (const p of platforms) {
      if (this.checkAABB(this.x, resolvedY, halfW, halfH, p)) {
        if (this.vy > 0) {
          // Landing on top
          resolvedY = p.y - halfH;
          this.vy = 0;
          groundedThisFrame = true;
        } else if (this.vy < 0) {
          // Hitting ceiling
          resolvedY = p.y + p.height + halfH;
          this.vy = 0;
        }
      }
    }

    this.y = resolvedY;
    this.isGrounded = groundedThisFrame;
  }

  private checkAABB(
    cx: number,
    cy: number,
    halfW: number,
    halfH: number,
    p: PlatformBox
  ): boolean {
    const left = cx - halfW;
    const right = cx + halfW;
    const top = cy - halfH;
    const bottom = cy + halfH;

    return (
      left < p.x + p.width &&
      right > p.x &&
      top < p.y + p.height &&
      bottom > p.y
    );
  }

  public takeDamage(amount: number, fromDirectionX: number): boolean {
    if (this.dead || this.isStaggered()) {
      return false;
    }

    this.lives = Math.max(0, this.lives - amount);
    this.staggerTimerMs = this.tuning.staggerDurationMs;

    // Apply knockback away from threat
    const knockbackSign = fromDirectionX >= 0 ? -1 : 1;
    this.vx = knockbackSign * this.tuning.knockbackVelocityX;
    this.vy = this.tuning.knockbackVelocityY;
    this.isGrounded = false;

    if (this.lives <= 0) {
      this.kill();
    }

    return true;
  }

  public isStaggered(): boolean {
    return this.staggerTimerMs > 0;
  }

  public isAlive(): boolean {
    return !this.dead && this.lives > 0;
  }

  public kill(): void {
    this.dead = true;
    this.lives = 0;
    this.vx = 0;
    this.vy = 0;
  }

  public respawnAt(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.lives = this.tuning.maxLives;
    this.staggerTimerMs = 0;
    this.isGrounded = false;
  }

  public restoreHealth(amount: number = this.tuning.maxLives): void {
    this.lives = Math.min(this.tuning.maxLives, this.lives + amount);
    this.staggerTimerMs = 0;
    this.dead = false;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getState(): PlayerStateSnapshot {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      width: this.tuning.width,
      height: this.tuning.height,
      lives: this.lives,
      maxLives: this.tuning.maxLives,
      isGrounded: this.isGrounded,
      isStaggered: this.isStaggered(),
      staggerTimeRemainingMs: this.staggerTimerMs,
      isDead: this.dead,
      facingDirection: this.facingDirection,
    };
  }
}
