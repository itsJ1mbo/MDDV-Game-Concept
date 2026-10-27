import { EnemyTuning, LanternTuning } from '../../config/GameConfig';
import { EnemyState, EnemyStateSnapshot } from './EnemyTypes';

export class EnemyModel {
  private x: number;
  private y: number;
  private vx = 0;
  private vy = 0;
  private state: EnemyState = 'stalking';
  private exposureTimeMs = 0;
  private readonly exposureRequiredMs: number;
  private repelTimerMs = 0;
  private repelVx = 0;

  constructor(
    public readonly id: string,
    startX: number,
    startY: number,
    private readonly tuning: EnemyTuning,
    lanternTuning: LanternTuning
  ) {
    this.x = startX;
    this.y = startY;
    this.exposureRequiredMs = lanternTuning.enemyExposureRequiredMs;
  }

  public update(dtSeconds: number, playerX: number, playerY: number): void {
    if (this.state === 'destroyed') {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    const dtMs = dtSeconds * 1000;

    // Handle hit repel
    if (this.repelTimerMs > 0) {
      this.repelTimerMs = Math.max(0, this.repelTimerMs - dtMs);
      this.x += this.repelVx * dtSeconds;
      return;
    }

    // Direction to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      const dirX = dx / dist;
      const dirY = dy / dist;

      // When exposed, enemy is frozen/severely slowed
      const currentSpeed =
        this.state === 'exposed'
          ? this.tuning.stalkSpeed * this.tuning.frozenSpeedMultiplier
          : this.tuning.stalkSpeed;

      this.vx = dirX * currentSpeed;
      this.vy = dirY * currentSpeed;

      this.x += this.vx * dtSeconds;
      this.y += this.vy * dtSeconds;
    }
  }

  /**
   * Applies beam exposure. Returns true if destroyed on this frame.
   */
  public applyExposure(dtMs: number): boolean {
    if (this.state === 'destroyed') return false;

    this.state = 'exposed';
    this.exposureTimeMs += dtMs;

    if (this.exposureTimeMs >= this.exposureRequiredMs) {
      this.destroy();
      return true;
    }
    return false;
  }

  /**
   * Continuous exposure rule:
   * If light beam stops or enemy leaves beam, exposure resets immediately to 0.
   */
  public resetExposure(): void {
    if (this.state === 'destroyed') return;
    this.exposureTimeMs = 0;
    if (this.state === 'exposed') {
      this.state = 'stalking';
    }
  }

  public repelAwayFrom(fromX: number): void {
    const sign = this.x >= fromX ? 1 : -1;
    this.repelVx = sign * this.tuning.repelledSpeed;
    this.repelTimerMs = this.tuning.repelDurationMs;
  }

  public destroy(): void {
    this.state = 'destroyed';
    this.vx = 0;
    this.vy = 0;
  }

  public isDestroyed(): boolean {
    return this.state === 'destroyed';
  }

  public collidesWith(
    targetX: number,
    targetY: number,
    targetW: number,
    targetH: number
  ): boolean {
    if (this.state === 'destroyed') return false;

    const halfW = this.tuning.width / 2;
    const halfH = this.tuning.height / 2;
    const tHalfW = targetW / 2;
    const tHalfH = targetH / 2;

    return (
      Math.abs(this.x - targetX) < halfW + tHalfW &&
      Math.abs(this.y - targetY) < halfH + tHalfH
    );
  }

  public getState(): EnemyStateSnapshot {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      state: this.state,
      exposureTimeMs: this.exposureTimeMs,
      exposureRequiredMs: this.exposureRequiredMs,
      exposureRatio: Math.min(1, this.exposureTimeMs / this.exposureRequiredMs),
      isFrozen: this.state === 'exposed',
      isDestroyed: this.state === 'destroyed',
      width: this.tuning.width,
      height: this.tuning.height,
    };
  }
}
