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
  private orbitAngleDeg: number;
  private intensity: number;
  private activeTargetId: string | null = null;
  private threatTargetId: string | null = null;
  private threatProximityRatio = 0;
  private isBeamActive = false;
  private idleTimeSeconds = 0;

  constructor(
    public readonly side: LanternSide,
    private readonly tuning: LanternTuning
  ) {
    this.currentAngleDeg =
      side === 'left'
        ? tuning.idleAngleLeftDegrees
        : tuning.idleAngleRightDegrees;
    this.targetAngleDeg = this.currentAngleDeg;
    this.orbitAngleDeg = this.currentAngleDeg;
    this.intensity = tuning.idleIntensity;
  }

  public update(
    dtSeconds: number,
    focusTarget: SensingTarget | null,
    threatTargetOrRequest: SensingTarget | boolean | null,
    requestActiveBeam?: boolean
  ): void {
    const threatTarget =
      typeof threatTargetOrRequest === 'boolean'
        ? focusTarget
        : threatTargetOrRequest;
    const beamRequested =
      typeof threatTargetOrRequest === 'boolean'
        ? threatTargetOrRequest
        : requestActiveBeam ?? false;
    if (this.destroyed) {
      this.isBeamActive = false;
      this.activeTargetId = null;
      this.threatTargetId = null;
      this.threatProximityRatio = 0;
      this.intensity = 0;
      return;
    }

    this.idleTimeSeconds += dtSeconds;
    const hasTarget = focusTarget !== null;
    this.activeTargetId = focusTarget ? focusTarget.id : null;
    this.threatTargetId = threatTarget ? threatTarget.id : null;
    this.threatProximityRatio = threatTarget
      ? Math.max(
          0,
          Math.min(
            1,
            1 - threatTarget.distance / this.tuning.tingleDetectionRange
          )
        )
      : 0;

    // 1. Aim at a focused threat while independently orbiting the player.
    if (focusTarget) {
      this.targetAngleDeg = focusTarget.angleDegrees;
    } else {
      const baseAngle =
        this.side === 'left'
          ? this.tuning.idleAngleLeftDegrees
          : this.tuning.idleAngleRightDegrees;
      const phaseOffset = this.side === 'left' ? 0 : Math.PI;
      this.targetAngleDeg =
        baseAngle +
        Math.sin(
          this.idleTimeSeconds * this.tuning.idleWanderSpeedRadiansPerSec +
            phaseOffset
        ) *
          this.tuning.idleWanderAmplitudeDegrees;
    }

    this.swivelTowards(
      this.targetAngleDeg,
      dtSeconds,
      focusTarget
        ? this.tuning.focusSwivelSpeedDegPerSec
        : this.tuning.swivelSpeedDegPerSec
    );

    if (focusTarget) {
      this.swivelOrbitTowards(
        focusTarget.angleDegrees,
        dtSeconds,
        this.tuning.focusOrbitLerpSpeedDegPerSec
      );
    } else {
      const orbitDirection = this.side === 'left' ? 1 : -1;
      this.orbitAngleDeg =
        (this.orbitAngleDeg +
          orbitDirection * this.tuning.idleOrbitSpeedDegPerSec * dtSeconds +
          360) %
        360;
    }

    // 2. Beam request logic
    // Mechanic: If the beam does not sense any enemy it cannot be lit up
    const canFireBeam = hasTarget && beamRequested && !this.destroyed;
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
    } else if (threatTarget) {
      const proximity = Math.max(
        0,
        Math.min(
          1,
          1 - threatTarget.distance / this.tuning.tingleDetectionRange
        )
      );
      this.intensity =
        this.tuning.idleIntensity +
        proximity * (this.tuning.maxIntensity - this.tuning.idleIntensity);
    } else {
      this.intensity = this.tuning.idleIntensity;
    }
  }

  private swivelTowards(
    targetAngle: number,
    dtSeconds: number,
    swivelSpeedDegPerSec: number
  ): void {
    let diff = (targetAngle - this.currentAngleDeg) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;

    const maxDelta = swivelSpeedDegPerSec * dtSeconds;
    if (Math.abs(diff) <= maxDelta) {
      this.currentAngleDeg = targetAngle;
    } else {
      this.currentAngleDeg += Math.sign(diff) * maxDelta;
    }
    this.currentAngleDeg = (this.currentAngleDeg + 360) % 360;
  }

  private swivelOrbitTowards(
    targetAngle: number,
    dtSeconds: number,
    orbitSpeedDegPerSec: number
  ): void {
    let diff = (targetAngle - this.orbitAngleDeg) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;

    const maxDelta = orbitSpeedDegPerSec * dtSeconds;
    this.orbitAngleDeg =
      Math.abs(diff) <= maxDelta
        ? targetAngle
        : this.orbitAngleDeg + Math.sign(diff) * maxDelta;
    this.orbitAngleDeg = (this.orbitAngleDeg + 360) % 360;
  }

  public explode(): void {
    this.destroyed = true;
    this.heat = this.tuning.maxHeat;
    this.isBeamActive = false;
    this.activeTargetId = null;
    this.threatTargetId = null;
    this.threatProximityRatio = 0;
    this.intensity = 0;
  }

  public restore(): void {
    this.destroyed = false;
    this.heat = 0;
    this.isBeamActive = false;
    this.activeTargetId = null;
    this.threatTargetId = null;
    this.threatProximityRatio = 0;
    this.idleTimeSeconds = 0;
    this.currentAngleDeg =
      this.side === 'left'
        ? this.tuning.idleAngleLeftDegrees
        : this.tuning.idleAngleRightDegrees;
    this.targetAngleDeg = this.currentAngleDeg;
    this.orbitAngleDeg = this.currentAngleDeg;
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
      orbitAngleDegrees: this.orbitAngleDeg,
      orbitRadius: this.tuning.idleOrbitRadius,
      intensity: this.intensity,
      heat: this.heat,
      maxHeat: this.tuning.maxHeat,
      isDestroyed: this.destroyed,
      isBeamActive: this.isBeamActive,
      activeTargetId: this.activeTargetId,
      hasTarget: this.activeTargetId !== null,
      isThreatDetected: this.threatTargetId !== null,
      threatTargetId: this.threatTargetId,
      threatProximityRatio: this.threatProximityRatio,
    };
  }
}
