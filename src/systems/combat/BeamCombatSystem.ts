import { EnemyTuning, LanternTuning } from '../../config/GameConfig';
import { EnemyModel } from '../../domain/enemy/EnemyModel';
import { LanternModel } from '../../domain/lantern/LanternModel';
import { PlayerModel } from '../../domain/player/PlayerModel';

export interface CombatEventCallbacks {
  readonly onEnemyDamaged?: (enemyId: string, ratio: number) => void;
  readonly onEnemyDestroyed?: (enemyId: string) => void;
  readonly onPlayerDamaged?: (livesRemaining: number) => void;
}

export class BeamCombatSystem {
  constructor(
    private readonly lanternTuning: LanternTuning,
    private readonly enemyTuning: EnemyTuning
  ) {}

  public update(
    dtSeconds: number,
    player: PlayerModel,
    lanterns: readonly [LanternModel, LanternModel],
    enemies: readonly EnemyModel[],
    callbacks?: CombatEventCallbacks
  ): void {
    const dtMs = dtSeconds * 1000;
    const playerState = player.getState();
    const px = playerState.x;
    const py = playerState.y;

    const activeBeams = lanterns
      .map((l) => l.getState())
      .filter((s) => s.isBeamActive && !s.isDestroyed);

    // Track which enemies are currently inside at least one active beam cone
    const exposedEnemyIds = new Set<string>();

    for (const enemy of enemies) {
      if (enemy.isDestroyed()) continue;

      const enemyState = enemy.getState();
      let isInsideAnyBeam = false;

      for (const beam of activeBeams) {
        if (
          this.isInsideCone(
            px,
            py,
            beam.currentAngleDegrees,
            this.lanternTuning.maxBeamRange,
            this.lanternTuning.beamAngleDegrees,
            enemyState.x,
            enemyState.y,
            enemyState.width / 2
          )
        ) {
          isInsideAnyBeam = true;
          break;
        }
      }

      if (isInsideAnyBeam) {
        exposedEnemyIds.add(enemy.id);
        const destroyed = enemy.applyExposure(dtMs);
        callbacks?.onEnemyDamaged?.(enemy.id, enemy.getState().exposureRatio);

        if (destroyed) {
          callbacks?.onEnemyDestroyed?.(enemy.id);
        }
      } else {
        // Continuous exposure requirement:
        // If not in beam this frame, exposure resets immediately
        if (enemyState.exposureTimeMs > 0) {
          enemy.resetExposure();
        }
      }

      // 2. Contact damage with player
      if (
        player.isAlive() &&
        !player.isStaggered() &&
        !enemy.isDestroyed() &&
        enemy.collidesWith(
          playerState.x,
          playerState.y,
          playerState.width,
          playerState.height
        )
      ) {
        const damaged = player.takeDamage(
          this.enemyTuning.contactDamage,
          enemyState.x - playerState.x
        );
        if (damaged) {
          enemy.repelAwayFrom(playerState.x);
          callbacks?.onPlayerDamaged?.(player.getState().lives);
        }
      }
    }
  }

  public isInsideCone(
    originX: number,
    originY: number,
    coneAngleDeg: number,
    coneRange: number,
    coneSpreadDeg: number,
    targetX: number,
    targetY: number,
    targetRadius: number
  ): boolean {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const dist = Math.hypot(dx, dy);

    // Range check (with target radius tolerance)
    if (dist > coneRange + targetRadius) {
      return false;
    }

    if (dist < 1) {
      return true;
    }

    // Angle check
    let targetAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    targetAngleDeg = (targetAngleDeg + 360) % 360;

    let diff = Math.abs(targetAngleDeg - coneAngleDeg);
    if (diff > 180) {
      diff = 360 - diff;
    }

    // Spread tolerance includes angular width of target at distance
    const angularRadiusDeg = (Math.asin(Math.min(1, targetRadius / dist)) * 180) / Math.PI;
    const halfSpread = coneSpreadDeg / 2;

    return diff <= halfSpread + angularRadiusDeg;
  }
}
