import { LanternTuning } from '../../config/GameConfig';
import {
  LanternSide,
  LanternStateSnapshot,
  LanternStatus,
  SensingTarget,
} from './LanternTypes';

export class LanternModel {
  private heat = 0;
  private destroyed = false;
  private currentAngleDeg: number;
  private targetAngleDeg: number;
  private intensity: number;
  private activeTargetId: string | null = null;
  private isBeamActive = false;

  constructor(
    public readonly side: LanternSide,
    private readonly tuning: LanternTuning
  ) {
    this.currentAngleDeg =
      side === 'left'
        ? tuning.idleAngleLeftDegrees
        : tuning.idleAngleRightDegrees;
    this.targetAngleDeg = this.currentAngleDeg;
    this.intensity = tuning.idleIntensity;
  }

  public update(
    dtSeconds: number,
    target: SensingTarget | null,
    requestActiveBeam: boolean
  ): void {
    if (this.destroyed) {
      this.isBeamActive = false;
      this.activeTargetId = null;
      this.intensity = 0;
      return;
    }

    const hasTarget = target !== null;
    this.activeTargetId = target ? target.id : null;

    // 1. Swivel targeting
    if (hasTarget) {
      this.targetAngleDeg = target.angleDegrees;
    } else {
      this.targetAngleDeg =
        this.side === 'left'
          ? this.tuning.idleAngleLeftDegrees
          : this.tuning.idleAngleRightDegrees;
    }

    this.swivelTowards(this.targetAngleDeg, dtSeconds);

    // 2. Beam request logic
    // Mechanic: If the beam does not sense any enemy it cannot be lit up
    const canFireBeam = hasTarget && requestActiveBeam && !this.destroyed;
    this.isBeamActive = canFireBeam;

    // 3. Heat & Cooling
    if (this.isBeamActive) {
      this.heat += this.tuning.heatPerSecond * dtSeconds;
      if (this.heat >= this.tuning.maxHeat) {
        this.explode();
        return;
      }
    } else if (this.heat > 0) {
      this.heat = Math.max(0, this.heat - this.tuning.coolingPerSecond * dtSeconds);
    }

    // 4. Intensity
    if (this.isBeamActive) {
      this.intensity = this.tuning.maxIntensity;
    } else if (hasTarget) {
      const proximity = Math.max(
        0,
        Math.min(1, 1 - target.distance / this.tuning.detectionRange)
      );
      this.intensity =
        this.tuning.idleIntensity +
        proximity * (this.tuning.maxIntensity - this.tuning.idleIntensity);
    } else {
      this.intensity = this.tuning.idleIntensity;
    }
  }

  private swivelTowards(targetAngle: number, dtSeconds: number): void {
    let diff = (targetAngle - this.currentAngleDeg) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;

    const maxDelta = this.tuning.swivelSpeedDegPerSec * dtSeconds;
    if (Math.abs(diff) <= maxDelta) {
      this.currentAngleDeg = targetAngle;
    } else {
      this.currentAngleDeg += Math.sign(diff) * maxDelta;
    }
    this.currentAngleDeg = (this.currentAngleDeg + 360) % 360;
  }

  public explode(): void {
    this.destroyed = true;
    this.heat = this.tuning.maxHeat;
    this.isBeamActive = false;
    this.activeTargetId = null;
    this.intensity = 0;
  }

  public restore(): void {
    this.destroyed = false;
    this.heat = 0;
    this.isBeamActive = false;
    this.activeTargetId = null;
    this.currentAngleDeg =
      this.side === 'left'
        ? this.tuning.idleAngleLeftDegrees
        : this.tuning.idleAngleRightDegrees;
    this.targetAngleDeg = this.currentAngleDeg;
    this.intensity = this.tuning.idleIntensity;
  }

  public getStatus(): LanternStatus {
    if (this.destroyed) return 'destroyed';
    if (this.isBeamActive) return 'active_beam';
    if (this.heat > 0) return 'cooling';
    if (this.activeTargetId !== null) return 'sensing';
    return 'idle';
  }

  public getState(): LanternStateSnapshot {
    return {
      side: this.side,
      status: this.getStatus(),
      currentAngleDegrees: this.currentAngleDeg,
      targetAngleDegrees: this.targetAngleDeg,
      intensity: this.intensity,
      heat: this.heat,
      maxHeat: this.tuning.maxHeat,
      isDestroyed: this.destroyed,
      isBeamActive: this.isBeamActive,
      activeTargetId: this.activeTargetId,
      hasTarget: this.activeTargetId !== null,
    };
  }
}
