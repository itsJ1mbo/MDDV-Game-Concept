import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_CONFIG, validateConfig, GameConfig } from '../src/config/GameConfig';
import { LanternModel } from '../src/domain/lantern/LanternModel';

describe('Lighting and Fog of War System', () => {
  describe('Test 1: Absolute Darkness & Pitch Black Baseline', () => {
    it('enforces absolute black ambient color (#000000) and 100% opacity', () => {
      expect(DEFAULT_GAME_CONFIG.fog.fogColor).toBe(0x000000);
      expect(DEFAULT_GAME_CONFIG.fog.fogOpacity).toBe(1.0);
      expect(DEFAULT_GAME_CONFIG.fog.ambientLightColor).toBe(0x000000);
      expect(DEFAULT_GAME_CONFIG.fog.ambientLightOpacity).toBe(1.0);
    });

    it('validates fog configuration and rejects invalid parameters', () => {
      expect(() => validateConfig(DEFAULT_GAME_CONFIG)).not.toThrow();

      const invalidOpacityConfig: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        fog: {
          ...DEFAULT_GAME_CONFIG.fog,
          fogOpacity: -0.5,
        },
      };
      expect(() => validateConfig(invalidOpacityConfig)).toThrow(
        /fog\.fogOpacity must be between 0 and 1/
      );

      const invalidRadiusConfig: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        fog: {
          ...DEFAULT_GAME_CONFIG.fog,
          playerVisibilityRadius: 0,
        },
      };
      expect(() => validateConfig(invalidRadiusConfig)).toThrow(
        /fog\.playerVisibilityRadius must be > 0/
      );
    });
  });

  describe('Test 2: Color Spectrum & Overexposure Control', () => {
    it('restricts lantern beam color to warm amber and prevents pure white overexposure', () => {
      const beamColor = DEFAULT_GAME_CONFIG.fog.lanternBeamColor;
      const red = (beamColor >> 16) & 0xff;
      const green = (beamColor >> 8) & 0xff;
      const blue = beamColor & 0xff;

      // Pure white is (255, 255, 255). Warm amber requires Red > Green and Blue strictly clamped low
      expect(red).toBeGreaterThan(200);
      expect(green).toBeGreaterThan(100);
      expect(green).toBeLessThan(red);
      // Blue must be clamped low (< 50) to prevent desaturation and white highlights
      expect(blue).toBeLessThanOrEqual(50);
      expect(beamColor).not.toBe(0xffffff);
    });

    it('restricts lantern halo color to deep warm amber spectrum', () => {
      const haloColor = DEFAULT_GAME_CONFIG.fog.lanternHaloColor;
      const red = (haloColor >> 16) & 0xff;
      const green = (haloColor >> 8) & 0xff;
      const blue = haloColor & 0xff;

      expect(red).toBeGreaterThan(180);
      expect(green).toBeLessThan(red);
      // Deep warm amber halo has minimal blue component (< 30)
      expect(blue).toBeLessThanOrEqual(30);
      expect(haloColor).not.toBe(0xffffff);
    });

    it('strictly clamps illumination overlay intensities to prevent washing out textures', () => {
      // Clamped low (<= 0.20) so underlying hand-drawn art maintains 80%+ native contrast
      expect(DEFAULT_GAME_CONFIG.fog.lanternBeamIntensity).toBeLessThanOrEqual(0.2);
      expect(DEFAULT_GAME_CONFIG.fog.lanternBeamIntensity).toBeGreaterThan(0);

      expect(DEFAULT_GAME_CONFIG.fog.lanternHaloIntensity).toBeLessThanOrEqual(0.15);
      expect(DEFAULT_GAME_CONFIG.fog.lanternHaloIntensity).toBeGreaterThan(0);
    });

    it('rejects out-of-range illumination intensities during validation', () => {
      const invalidBeamIntensity: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        fog: {
          ...DEFAULT_GAME_CONFIG.fog,
          lanternBeamIntensity: 1.5,
        },
      };
      expect(() => validateConfig(invalidBeamIntensity)).toThrow(
        /fog\.lanternBeamIntensity must be between 0 and 1/
      );

      const invalidHaloIntensity: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        fog: {
          ...DEFAULT_GAME_CONFIG.fog,
          lanternHaloIntensity: -0.1,
        },
      };
      expect(() => validateConfig(invalidHaloIntensity)).toThrow(
        /fog\.lanternHaloIntensity must be between 0 and 1/
      );
    });
  });

  describe('Test 3: FoW Masking vs Scene Illumination Decoupling', () => {
    it('passive threat-sensing does NOT activate beam visibility cone', () => {
      const lantern = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);

      // Threat detected at 150px, but user has NOT activated the beam button (beamRequested = false)
      lantern.update(
        0.1,
        { id: 'enemy-1', x: 250, y: 200, distance: 150, angleDegrees: 45 },
        false
      );

      const state = lantern.getState();
      expect(state.hasTarget).toBe(true);
      expect(state.isBeamActive).toBe(false);
      // Because isBeamActive is false, FoW mask is NOT erased for the beam cone
    });

    it('destroyed lanterns cannot activate beam cone even when input is held', () => {
      const lantern = new LanternModel('right', DEFAULT_GAME_CONFIG.lantern);

      // Force lantern to overheat and explode
      lantern.update(
        DEFAULT_GAME_CONFIG.lantern.maxHeat / DEFAULT_GAME_CONFIG.lantern.heatPerSecond + 0.1,
        { id: 'enemy-2', x: 300, y: 200, distance: 100, angleDegrees: 0 },
        true
      );

      expect(lantern.getState().isDestroyed).toBe(true);

      // Subsequent input cannot trigger beam
      lantern.update(0.1, null, true);
      const state = lantern.getState();
      expect(state.isBeamActive).toBe(false);
      // Exploded lantern produces 0 beam cutout, preserving total darkness
    });

    it('active beam accurately matches configured range and angle parameters', () => {
      const lantern = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);

      lantern.update(
        0.1,
        { id: 'enemy-3', x: 250, y: 200, distance: 120, angleDegrees: 90 },
        true
      );

      const state = lantern.getState();
      expect(state.isBeamActive).toBe(true);
      expect(state.currentAngleDegrees).toBeCloseTo(90, 0);
      expect(DEFAULT_GAME_CONFIG.lantern.maxBeamRange).toBe(260);
      expect(DEFAULT_GAME_CONFIG.lantern.beamAngleDegrees).toBe(34);
    });
  });
});
