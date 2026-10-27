import { describe, it, expect, beforeEach } from 'vitest';
import { BeamCombatSystem } from '../src/systems/combat/BeamCombatSystem';
import { PlayerModel } from '../src/domain/player/PlayerModel';
import { LanternModel } from '../src/domain/lantern/LanternModel';
import { EnemyModel } from '../src/domain/enemy/EnemyModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';

describe('BeamCombatSystem', () => {
  let combatSystem: BeamCombatSystem;
  let player: PlayerModel;
  let lanternLeft: LanternModel;
  let lanternRight: LanternModel;
  let enemy: EnemyModel;

  beforeEach(() => {
    combatSystem = new BeamCombatSystem(
      DEFAULT_GAME_CONFIG.lantern,
      DEFAULT_GAME_CONFIG.enemy
    );
    player = new PlayerModel(200, 200, DEFAULT_GAME_CONFIG.player);
    lanternLeft = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);
    lanternRight = new LanternModel('right', DEFAULT_GAME_CONFIG.lantern);
    // Enemy placed directly to the right (angle 0)
    enemy = new EnemyModel(
      'target-1',
      300,
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );
  });

  it('detects point inside beam cone correctly', () => {
    // origin (0, 0), facing 0 deg (east), range 200, spread 30 deg
    const inside = combatSystem.isInsideCone(0, 0, 0, 200, 30, 100, 10, 5);
    expect(inside).toBe(true);

    const outsideAngle = combatSystem.isInsideCone(0, 0, 0, 200, 30, 100, 80, 5);
    expect(outsideAngle).toBe(false);

    const outsideRange = combatSystem.isInsideCone(0, 0, 0, 200, 30, 250, 0, 5);
    expect(outsideRange).toBe(false);
  });

  it('applies exposure to enemy when inside active beam cone', () => {
    // Lock lantern right to target and fire beam
    lanternRight.update(
      0.1,
      { id: enemy.id, x: 300, y: 200, distance: 100, angleDegrees: 0 },
      true
    );

    let enemyDestroyedCalled = false;
    combatSystem.update(
      0.5,
      player,
      [lanternLeft, lanternRight],
      [enemy],
      {
        onEnemyDestroyed: () => {
          enemyDestroyedCalled = true;
        },
      }
    );

    expect(enemy.getState().exposureTimeMs).toBe(500);
    expect(enemyDestroyedCalled).toBe(false);
  });

  it('resets exposure immediately when beam stops before threshold', () => {
    // 1st frame: beam hits enemy
    lanternRight.update(
      0.1,
      { id: enemy.id, x: 300, y: 200, distance: 100, angleDegrees: 0 },
      true
    );
    combatSystem.update(0.5, player, [lanternLeft, lanternRight], [enemy]);
    expect(enemy.getState().exposureTimeMs).toBe(500);

    // 2nd frame: beam stopped
    lanternRight.update(
      0.1,
      { id: enemy.id, x: 300, y: 200, distance: 100, angleDegrees: 0 },
      false
    );
    combatSystem.update(0.1, player, [lanternLeft, lanternRight], [enemy]);

    // Exposure MUST reset to 0 per DESIGN.md
    expect(enemy.getState().exposureTimeMs).toBe(0);
    expect(enemy.getState().state).toBe('stalking');
  });

  it('destroys enemy when continuous exposure reaches threshold', () => {
    lanternRight.update(
      0.1,
      { id: enemy.id, x: 300, y: 200, distance: 100, angleDegrees: 0 },
      true
    );

    let destroyedId = '';
    // 1.3 seconds exposure > 1200ms threshold
    combatSystem.update(
      1.3,
      player,
      [lanternLeft, lanternRight],
      [enemy],
      {
        onEnemyDestroyed: (id) => {
          destroyedId = id;
        },
      }
    );

    expect(destroyedId).toBe(enemy.id);
    expect(enemy.isDestroyed()).toBe(true);
  });

  it('damages and staggers player on enemy contact', () => {
    // Place enemy on top of player
    const closeEnemy = new EnemyModel(
      'close-1',
      200,
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );

    let damagedLives = -1;
    combatSystem.update(
      0.016,
      player,
      [lanternLeft, lanternRight],
      [closeEnemy],
      {
        onPlayerDamaged: (lives) => {
          damagedLives = lives;
        },
      }
    );

    expect(damagedLives).toBe(2);
    expect(player.getState().lives).toBe(2);
    expect(player.isStaggered()).toBe(true);
  });
});
