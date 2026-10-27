import { CheckpointTuning } from '../../config/GameConfig';
import { LanternModel } from '../lantern/LanternModel';
import { PlayerModel } from '../player/PlayerModel';
import { CheckpointModel } from './CheckpointModel';
import { RestResult } from './CheckpointTypes';

export class CheckpointService {
  private checkpoints: CheckpointModel[] = [];
  private activeRespawnId: string | null = null;

  constructor(private readonly tuning: CheckpointTuning) {}

  public register(checkpoint: CheckpointModel): void {
    this.checkpoints.push(checkpoint);
    if (this.checkpoints.length === 1 && !this.activeRespawnId) {
      this.setActiveRespawn(checkpoint.id);
    }
  }

  public getCheckpoints(): readonly CheckpointModel[] {
    return this.checkpoints;
  }

  public getById(id: string): CheckpointModel | undefined {
    return this.checkpoints.find((c) => c.id === id);
  }

  public getNearestCheckpoint(x: number, y: number): CheckpointModel | null {
    if (this.checkpoints.length === 0) return null;

    let nearest = this.checkpoints[0];
    let minDistance = nearest.distanceTo(x, y);

    for (let i = 1; i < this.checkpoints.length; i++) {
      const c = this.checkpoints[i];
      const d = c.distanceTo(x, y);
      if (d < minDistance) {
        minDistance = d;
        nearest = c;
      }
    }

    return nearest;
  }

  public getActiveRespawnPoint(): { x: number; y: number } {
    if (this.activeRespawnId) {
      const cp = this.getById(this.activeRespawnId);
      if (cp) return { x: cp.x, y: cp.y };
    }
    if (this.checkpoints.length > 0) {
      return { x: this.checkpoints[0].x, y: this.checkpoints[0].y };
    }
    return { x: 100, y: 100 };
  }

  public setActiveRespawn(checkpointId: string): void {
    this.activeRespawnId = checkpointId;
    for (const cp of this.checkpoints) {
      cp.setCurrentRespawn(cp.id === checkpointId);
    }
  }

  public getInteractableCheckpoint(
    playerX: number,
    playerY: number
  ): CheckpointModel | null {
    for (const cp of this.checkpoints) {
      if (cp.isPlayerInRange(playerX, playerY, this.tuning.interactionRadius)) {
        return cp;
      }
    }
    return null;
  }

  public restAt(
    checkpointId: string,
    player: PlayerModel,
    lanterns: readonly LanternModel[]
  ): RestResult {
    const checkpoint = this.getById(checkpointId);
    if (!checkpoint) {
      return {
        success: false,
        checkpointId,
        restoredLives: 0,
        lanternsRestored: false,
        message: 'Checkpoint not found',
      };
    }

    // Set as active respawn
    this.setActiveRespawn(checkpointId);

    // Restore player health & clear stagger
    player.restoreHealth(this.tuning.restHealAmount);

    // Restore all lanterns (including heat & destroyed state)
    let anyLanternRestored = false;
    if (this.tuning.restRestoreLanterns) {
      for (const lantern of lanterns) {
        if (lantern.getState().isDestroyed || lantern.getState().heat > 0) {
          anyLanternRestored = true;
        }
        lantern.restore();
      }
    }

    return {
      success: true,
      checkpointId,
      restoredLives: player.getState().lives,
      lanternsRestored: anyLanternRestored,
      message: `Rested at ${checkpoint.name}. Light and spirit restored.`,
    };
  }
}
