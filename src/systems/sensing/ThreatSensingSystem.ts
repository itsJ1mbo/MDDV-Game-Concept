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
    leftThreat: SensingTarget | null;
    rightThreat: SensingTarget | null;
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
      .filter((c) => c.distance <= this.lanternTuning.tingleDetectionRange)
      .sort((a, b) => a.distance - b.distance);

    let leftTarget: SensingTarget | null = null;
    let rightTarget: SensingTarget | null = null;

    const leftThreat = this.selectTarget(candidates, true);
    const rightThreat = this.selectTarget(candidates, false);
    const closeCandidates = candidates.filter(
      (candidate) =>
        candidate.distance <= this.lanternTuning.focusDetectionRange
    );

    leftTarget = this.selectTarget(closeCandidates, true);
    rightTarget = this.selectTarget(closeCandidates, false);

    return { leftTarget, rightTarget, leftThreat, rightThreat };
  }

  private selectTarget(
    candidates: readonly (SensingTarget & { isLeftOfPlayer: boolean })[],
    leftSide: boolean
  ): SensingTarget | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return this.toSensingTarget(candidates[0]);

    const sideCandidates = candidates.filter(
      (candidate) => candidate.isLeftOfPlayer === leftSide
    );
    const selected = sideCandidates[0] ?? candidates[0];
    return this.toSensingTarget(selected);
  }

  private toSensingTarget(
    candidate: SensingTarget & { isLeftOfPlayer: boolean }
  ): SensingTarget {
    return {
      id: candidate.id,
      x: candidate.x,
      y: candidate.y,
      distance: candidate.distance,
      angleDegrees: candidate.angleDegrees,
    };
  }
}
