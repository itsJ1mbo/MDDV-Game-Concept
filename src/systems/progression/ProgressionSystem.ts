import { LevelTuning } from '../../config/GameConfig';
import { CheckpointService } from '../../domain/checkpoint/CheckpointService';
import { EnemyModel } from '../../domain/enemy/EnemyModel';
import { LanternModel } from '../../domain/lantern/LanternModel';
import { LevelDefinition } from '../../domain/level/LevelTypes';
import { PlayerModel } from '../../domain/player/PlayerModel';

export interface ProgressionCallbacks {
  readonly onPlayerDied?: () => void;
  readonly onPlayerRespawned?: (x: number, y: number) => void;
  readonly onLevelCompleted?: () => void;
}

export class ProgressionSystem {
  private levelCompleted = false;

  constructor(
    private readonly levelTuning: LevelTuning,
    private readonly checkpointService: CheckpointService
  ) {}

  public update(
    player: PlayerModel,
    lanterns: readonly [LanternModel, LanternModel],
    enemies: readonly EnemyModel[],
    level: LevelDefinition,
    callbacks?: ProgressionCallbacks
  ): void {
    const playerState = player.getState();

    // 1. Abyss check
    if (playerState.y > this.levelTuning.abyssY && player.isAlive()) {
      player.kill();
      callbacks?.onPlayerDied?.();
    }

    // 2. Death & Respawn
    if (!player.isAlive()) {
      const respawnPoint = this.checkpointService.getActiveRespawnPoint();
      player.respawnAt(respawnPoint.x, respawnPoint.y);

      // Reset transient state across enemies and lanterns as per AGENTS.md
      for (const enemy of enemies) {
        enemy.resetExposure();
      }
      for (const lantern of lanterns) {
        if (!lantern.getState().isDestroyed) {
          lantern.restore();
        }
      }

      callbacks?.onPlayerRespawned?.(respawnPoint.x, respawnPoint.y);
    }

    // 3. Goal area check
    if (
      !this.levelCompleted &&
      player.isAlive() &&
      this.checkGoal(playerState.x, playerState.y, level.goalArea)
    ) {
      this.levelCompleted = true;
      callbacks?.onLevelCompleted?.();
    }
  }

  public isLevelCompleted(): boolean {
    return this.levelCompleted;
  }

  public reset(): void {
    this.levelCompleted = false;
  }

  private checkGoal(
    px: number,
    py: number,
    goal: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      px >= goal.x &&
      px <= goal.x + goal.width &&
      py >= goal.y &&
      py <= goal.y + goal.height
    );
  }
}
