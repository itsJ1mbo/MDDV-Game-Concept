import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyModel } from '../src/domain/enemy/EnemyModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';

describe('EnemyModel', () => {
  let enemy: EnemyModel;

  beforeEach(() => {
    enemy = new EnemyModel(
      'shadow-1',
      200,
      100,
      DEFAULT_GAME_CONFIG.enemy,
      DEFAULT_GAME_CONFIG.lantern
    );
  });

  it('stalks towards player location', () => {
    // Player is at (100, 100) -> left of enemy
    enemy.update(1.0, 100, 100);
    const state = enemy.getState();
    expect(state.x).toBeLessThan(200);
    expect(state.vx).toBeLessThan(0);
    expect(state.state).toBe('stalking');
  });

  it('freezes and accumulates exposure when exposed to beam', () => {
    const destroyed = enemy.applyExposure(500);
    expect(destroyed).toBe(false);

    const state = enemy.getState();
    expect(state.isFrozen).toBe(true);
    expect(state.state).toBe('exposed');
    expect(state.exposureTimeMs).toBe(500);
    expect(state.exposureRatio).toBeCloseTo(500 / 1200, 2);
  });

  it('destroys enemy when continuous exposure meets threshold', () => {
    enemy.applyExposure(600);
    expect(enemy.isDestroyed()).toBe(false);

    const destroyed = enemy.applyExposure(600); // 1200ms total
    expect(destroyed).toBe(true);
    expect(enemy.isDestroyed()).toBe(true);
    expect(enemy.getState().state).toBe('destroyed');
  });

  it('immediately resets exposure to 0 if beam stops before reaching threshold', () => {
    enemy.applyExposure(800);
    expect(enemy.getState().exposureTimeMs).toBe(800);

    // Light source stops
    enemy.resetExposure();
    const state = enemy.getState();
    expect(state.exposureTimeMs).toBe(0);
    expect(state.state).toBe('stalking');
    expect(state.isFrozen).toBe(false);
  });

  it('repels away from target point when commanded', () => {
    // Enemy is at 200. Repel away from 150 -> moves right
    enemy.repelAwayFrom(150);
    enemy.update(0.1, 100, 100);
    expect(enemy.getState().x).toBeGreaterThan(200);
  });
});
