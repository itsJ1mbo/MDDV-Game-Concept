import { PlatformBox } from '../player/PlayerTypes';

export interface EnemySpawnPoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly triggerDistance?: number;
}

export interface CheckpointDef {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

export interface LevelDefinition {
  readonly id: string;
  readonly name: string;
  readonly startX: number;
  readonly startY: number;
  readonly platforms: readonly PlatformBox[];
  readonly checkpoints: readonly CheckpointDef[];
  readonly enemySpawns: readonly EnemySpawnPoint[];
  readonly goalArea: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}
