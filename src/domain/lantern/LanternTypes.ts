export type LanternSide = 'left' | 'right';

export type LanternStatus =
  | 'idle'
  | 'sensing'
  | 'active_beam'
  | 'cooling'
  | 'destroyed';

export interface SensingTarget {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly distance: number;
  readonly angleDegrees: number;
}

export interface LanternStateSnapshot {
  readonly side: LanternSide;
  readonly status: LanternStatus;
  readonly currentAngleDegrees: number;
  readonly targetAngleDegrees: number;
  readonly intensity: number; // 0.0 to 1.0
  readonly heat: number; // 0 to maxHeat
  readonly maxHeat: number;
  readonly isDestroyed: boolean;
  readonly isBeamActive: boolean;
  readonly activeTargetId: string | null;
  readonly hasTarget: boolean;
}
