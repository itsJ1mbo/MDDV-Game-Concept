import { LanternTuning } from '../../config/GameConfig';
import { EnemyModel } from '../../domain/enemy/EnemyModel';
import { LanternModel } from '../../domain/lantern/LanternModel';
import { SensingTarget } from '../../domain/lantern/LanternTypes';
import { PlayerModel } from '../../domain/player/PlayerModel';

export class ThreatSensingSystem {
  constructor(private readonly lanternTuning: LanternTuning) {}

  public update(
    player: PlayerModel,
    _lanterns: readonly [LanternModel, LanternModel],
    enemies: readonly EnemyModel[]
  ): {
    leftTarget: SensingTarget | null;
    rightTarget: SensingTarget | null;
  } {
    const playerState = player.getState();
    const px = playerState.x;
    const py = playerState.y;

    // Filter alive enemies within detection range
    const activeEnemies = enemies.filter(
      (e) => !e.isDestroyed()
    );

    const candidates = activeEnemies
      .map((e) => {
        const state = e.getState();
        const dx = state.x - px;
        const dy = state.y - py;
        const distance = Math.hypot(dx, dy);
        let angleDegrees = (Math.atan2(dy, dx) * 180) / Math.PI;
        angleDegrees = (angleDegrees + 360) % 360;

        return {
          id: state.id,
          x: state.x,
          y: state.y,
          distance,
          angleDegrees,
          isLeftOfPlayer: dx < 0,
        };
      })
      .filter((c) => c.distance <= this.lanternTuning.detectionRange)
      .sort((a, b) => a.distance - b.distance);

    let leftTarget: SensingTarget | null = null;
    let rightTarget: SensingTarget | null = null;

    if (candidates.length === 0) {
      return { leftTarget: null, rightTarget: null };
    }

    if (candidates.length === 1) {
      // Single threat: both lanterns can sense it
      const target: SensingTarget = {
        id: candidates[0].id,
        x: candidates[0].x,
        y: candidates[0].y,
        distance: candidates[0].distance,
        angleDegrees: candidates[0].angleDegrees,
      };
      return { leftTarget: target, rightTarget: target };
    }

    // Multiple threats: prioritize left-side for left lantern, right-side for right lantern
    const leftCandidates = candidates.filter((c) => c.isLeftOfPlayer);
    const rightCandidates = candidates.filter((c) => !c.isLeftOfPlayer);

    if (leftCandidates.length > 0) {
      const bestLeft = leftCandidates[0];
      leftTarget = {
        id: bestLeft.id,
        x: bestLeft.x,
        y: bestLeft.y,
        distance: bestLeft.distance,
        angleDegrees: bestLeft.angleDegrees,
      };
    } else {
      const fallback = candidates[0];
      leftTarget = {
        id: fallback.id,
        x: fallback.x,
        y: fallback.y,
        distance: fallback.distance,
        angleDegrees: fallback.angleDegrees,
      };
    }

    if (rightCandidates.length > 0) {
      const bestRight = rightCandidates[0];
      rightTarget = {
        id: bestRight.id,
        x: bestRight.x,
        y: bestRight.y,
        distance: bestRight.distance,
        angleDegrees: bestRight.angleDegrees,
      };
    } else {
      // If no right candidates, pick second closest overall or closest
      const fallback = candidates[1] ?? candidates[0];
      rightTarget = {
        id: fallback.id,
        x: fallback.x,
        y: fallback.y,
        distance: fallback.distance,
        angleDegrees: fallback.angleDegrees,
      };
    }

    return { leftTarget, rightTarget };
  }
}
