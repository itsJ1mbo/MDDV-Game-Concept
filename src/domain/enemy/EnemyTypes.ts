export type EnemyState = 'spawning' | 'stalking' | 'exposed' | 'destroyed';

export interface EnemyStateSnapshot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly state: EnemyState;
  readonly exposureTimeMs: number;
  readonly exposureRequiredMs: number;
  readonly exposureRatio: number; // 0.0 to 1.0
  readonly isFrozen: boolean;
  readonly isDestroyed: boolean;
  readonly width: number;
  readonly height: number;
}
