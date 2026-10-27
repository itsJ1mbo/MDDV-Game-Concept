import { describe, it, expect, beforeEach } from 'vitest';
import { LanternModel } from '../src/domain/lantern/LanternModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';
import { SensingTarget } from '../src/domain/lantern/LanternTypes';

describe('LanternModel', () => {
  let lantern: LanternModel;

  beforeEach(() => {
    lantern = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);
  });

  it('starts idle with base intensity and 0 heat', () => {
    const state = lantern.getState();
    expect(state.status).toBe('idle');
    expect(state.heat).toBe(0);
    expect(state.isDestroyed).toBe(false);
    expect(state.intensity).toBe(DEFAULT_GAME_CONFIG.lantern.idleIntensity);
  });

  it('swivels towards sensed target and increases intensity with proximity', () => {
    const farTarget: SensingTarget = {
      id: 'enemy-1',
      x: 50,
      y: 50,
      distance: 250,
      angleDegrees: 220,
    };

    lantern.update(0.1, farTarget, false);
    let state = lantern.getState();
    expect(state.status).toBe('sensing');
    expect(state.hasTarget).toBe(true);
    const farIntensity = state.intensity;
    expect(farIntensity).toBeGreaterThan(DEFAULT_GAME_CONFIG.lantern.idleIntensity);

    const closeTarget: SensingTarget = {
      id: 'enemy-1',
      x: 90,
      y: 90,
      distance: 30,
      angleDegrees: 220,
    };
    lantern.update(0.1, closeTarget, false);
    state = lantern.getState();
    expect(state.intensity).toBeGreaterThan(farIntensity);
  });

  it('cannot activate beam if no target is sensed', () => {
    lantern.update(0.1, null, true);
    const state = lantern.getState();
    expect(state.isBeamActive).toBe(false);
    expect(state.heat).toBe(0);
  });

  it('activates beam and accumulates heat when target is sensed and button pressed', () => {
    const target: SensingTarget = {
      id: 'enemy-1',
      x: 50,
      y: 50,
      distance: 100,
      angleDegrees: 180,
    };

    lantern.update(0.5, target, true);
    const state = lantern.getState();
    expect(state.isBeamActive).toBe(true);
    expect(state.status).toBe('active_beam');
    expect(state.heat).toBeCloseTo(DEFAULT_GAME_CONFIG.lantern.heatPerSecond * 0.5, 1);
  });

  it('cools down when beam is released', () => {
    const target: SensingTarget = {
      id: 'enemy-1',
      x: 50,
      y: 50,
      distance: 100,
      angleDegrees: 180,
    };

    lantern.update(1.0, target, true); // generates ~38 heat
    const heatBefore = lantern.getState().heat;
    expect(heatBefore).toBeGreaterThan(0);

    lantern.update(0.5, target, false); // releases beam, cooling begins
    const state = lantern.getState();
    expect(state.isBeamActive).toBe(false);
    expect(state.heat).toBeLessThan(heatBefore);
  });

  it('explodes when heat reaches maximum and becomes destroyed', () => {
    const target: SensingTarget = {
      id: 'enemy-1',
      x: 50,
      y: 50,
      distance: 100,
      angleDegrees: 180,
    };

    // Hold for long time (e.g. 3.5s at 38/s = 133 heat > 100)
    lantern.update(3.5, target, true);
    const state = lantern.getState();
    expect(state.isDestroyed).toBe(true);
    expect(state.status).toBe('destroyed');
    expect(state.isBeamActive).toBe(false);
    expect(state.intensity).toBe(0);

    // Further updates do not activate beam
    lantern.update(0.1, target, true);
    expect(lantern.getState().isDestroyed).toBe(true);
    expect(lantern.getState().isBeamActive).toBe(false);
  });

  it('restores destroyed lantern back to full operation', () => {
    lantern.explode();
    expect(lantern.getState().isDestroyed).toBe(true);

    lantern.restore();
    const state = lantern.getState();
    expect(state.isDestroyed).toBe(false);
    expect(state.heat).toBe(0);
    expect(state.status).toBe('idle');
  });
});
