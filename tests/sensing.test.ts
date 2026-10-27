import { describe, it, expect, beforeEach } from 'vitest';
import { ThreatSensingSystem } from '../src/systems/sensing/ThreatSensingSystem';
import { PlayerModel } from '../src/domain/player/PlayerModel';
import { LanternModel } from '../src/domain/lantern/LanternModel';
import { EnemyModel } from '../src/domain/enemy/EnemyModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';

describe('ThreatSensingSystem', () => {
  let sensingSystem: ThreatSensingSystem;
  let player: PlayerModel;
  let lanternLeft: LanternModel;
  let lanternRight: LanternModel;

  beforeEach(() => {
    sensingSystem = new ThreatSensingSystem(DEFAULT_GAME_CONFIG.lantern);
    player = new PlayerModel(200, 200, DEFAULT_GAME_CONFIG.player);
    lanternLeft = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);
    lanternRight = new LanternModel('right', DEFAULT_GAME_CONFIG.lantern);
  });

  it('detects no targets when no enemies are in range', () => {
    // Enemy is far away (at x: 600, dist: 400 > detectionRange: 280)
    const farEnemy = new EnemyModel(
      'far-1',
      600,
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );

    const result = sensingSystem.update(
      player,
      [lanternLeft, lanternRight],
      [farEnemy]
    );

    expect(result.leftTarget).toBeNull();
    expect(result.rightTarget).toBeNull();
  });

  it('assigns single in-range enemy to both lanterns', () => {
    const enemy = new EnemyModel(
      'near-1',
      250,
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );

    const result = sensingSystem.update(
      player,
      [lanternLeft, lanternRight],
      [enemy]
    );

    expect(result.leftTarget?.id).toBe('near-1');
    expect(result.rightTarget?.id).toBe('near-1');
    expect(result.leftTarget?.distance).toBe(50);
  });

  it('distributes left and right enemies to appropriate lanterns', () => {
    const leftEnemy = new EnemyModel(
      'left-e',
      120, // dx = -80 (to the left)
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );
    const rightEnemy = new EnemyModel(
      'right-e',
      280, // dx = +80 (to the right)
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );

    const result = sensingSystem.update(
      player,
      [lanternLeft, lanternRight],
      [leftEnemy, rightEnemy]
    );

    expect(result.leftTarget?.id).toBe('left-e');
    expect(result.rightTarget?.id).toBe('right-e');
  });

  it('ignores destroyed enemies', () => {
    const deadEnemy = new EnemyModel(
      'dead-1',
      220,
      200,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );
    deadEnemy.destroy();

    const result = sensingSystem.update(
      player,
      [lanternLeft, lanternRight],
      [deadEnemy]
    );

    expect(result.leftTarget).toBeNull();
    expect(result.rightTarget).toBeNull();
  });
});
