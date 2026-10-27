export interface CheckpointStateSnapshot {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly isActivated: boolean;
  readonly isCurrentRespawn: boolean;
}

export interface RestResult {
  readonly success: boolean;
  readonly checkpointId: string;
  readonly restoredLives: number;
  readonly lanternsRestored: boolean;
  readonly message: string;
}
