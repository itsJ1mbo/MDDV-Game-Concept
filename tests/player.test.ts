import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerModel } from '../src/domain/player/PlayerModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';
import { PlatformBox } from '../src/domain/player/PlayerTypes';

describe('PlayerModel', () => {
  let player: PlayerModel;

  beforeEach(() => {
    player = new PlayerModel(100, 200, DEFAULT_GAME_CONFIG.player);
  });

  it('starts with max lives and full health', () => {
    const state = player.getState();
    expect(state.lives).toBe(3);
    expect(state.isDead).toBe(false);
    expect(state.isStaggered).toBe(false);
  });

  it('moves horizontally with input', () => {
    player.update({ moveX: 1, jump: false }, 0.1, []);
    const state = player.getState();
    expect(state.vx).toBeGreaterThan(0);
    expect(state.x).toBeGreaterThan(100);
    expect(state.facingDirection).toBe('right');
  });

  it('changes facing direction when moving left', () => {
    player.update({ moveX: -1, jump: false }, 0.1, []);
    const state = player.getState();
    expect(state.vx).toBeLessThan(0);
    expect(state.facingDirection).toBe('left');
  });

  it('jumps when grounded', () => {
    // Put platform right under player
    const platform: PlatformBox = { x: 50, y: 200 + DEFAULT_GAME_CONFIG.player.height / 2, width: 100, height: 20 };
    player.update({ moveX: 0, jump: false }, 0.016, [platform]);
    expect(player.getState().isGrounded).toBe(true);

    // Jump
    player.update({ moveX: 0, jump: true }, 0.016, [platform]);
    const state = player.getState();
    expect(state.vy).toBeLessThan(0);
    expect(state.vy).toBeCloseTo(
      DEFAULT_GAME_CONFIG.player.jumpVelocity + DEFAULT_GAME_CONFIG.player.gravity * 0.016,
      1
    );
    expect(state.isGrounded).toBe(false);
  });

  it('takes damage, reduces life by 1, and enters stagger state', () => {
    const damaged = player.takeDamage(1, 10);
    expect(damaged).toBe(true);
    const state = player.getState();
    expect(state.lives).toBe(2);
    expect(state.isStaggered).toBe(true);
    expect(state.staggerTimeRemainingMs).toBeGreaterThan(0);

    // Cannot take damage while staggered
    const secondDamaged = player.takeDamage(1, 10);
    expect(secondDamaged).toBe(false);
    expect(player.getState().lives).toBe(2);
  });

  it('recovers from stagger after duration expires', () => {
    player.takeDamage(1, 10);
    expect(player.isStaggered()).toBe(true);

    const dtSeconds = (DEFAULT_GAME_CONFIG.player.staggerDurationMs + 100) / 1000;
    player.update({ moveX: 0, jump: false }, dtSeconds, []);
    expect(player.isStaggered()).toBe(false);
  });

  it('dies when losing all lives', () => {
    player.takeDamage(1, 1);
    // Fast forward stagger
    player.update({ moveX: 0, jump: false }, 2, []);
    player.takeDamage(1, 1);
    player.update({ moveX: 0, jump: false }, 2, []);
    player.takeDamage(1, 1);

    const state = player.getState();
    expect(state.lives).toBe(0);
    expect(state.isDead).toBe(true);
    expect(player.isAlive()).toBe(false);
  });

  it('respawns at checkpoint with full health and reset state', () => {
    player.kill();
    expect(player.isAlive()).toBe(false);

    player.respawnAt(300, 400);
    const state = player.getState();
    expect(state.x).toBe(300);
    expect(state.y).toBe(400);
    expect(state.lives).toBe(3);
    expect(state.isDead).toBe(false);
    expect(state.isStaggered).toBe(false);
  });
});
