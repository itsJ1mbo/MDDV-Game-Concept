export interface PlayerTuning {
  readonly moveSpeed: number;
  readonly acceleration: number;
  readonly deceleration: number;
  readonly jumpVelocity: number;
  readonly gravity: number;
  readonly maxLives: number;
  readonly staggerDurationMs: number;
  readonly knockbackVelocityX: number;
  readonly knockbackVelocityY: number;
  readonly width: number;
  readonly height: number;
}

export interface LanternTuning {
  readonly tingleDetectionRange: number;
  readonly focusDetectionRange: number;
  readonly idleIntensity: number;
  readonly maxIntensity: number;
  readonly maxBeamRange: number;
  readonly beamAngleDegrees: number;
  readonly heatPerSecond: number;
  readonly coolingPerSecond: number;
  readonly maxHeat: number;
  readonly enemyExposureRequiredMs: number;
  readonly idleAngleLeftDegrees: number;
  readonly idleAngleRightDegrees: number;
  readonly swivelSpeedDegPerSec: number;
  readonly focusSwivelSpeedDegPerSec: number;
  readonly idleOrbitRadius: number;
  readonly idleOrbitSpeedDegPerSec: number;
  readonly focusOrbitLerpSpeedDegPerSec: number;
  readonly idleWanderAmplitudeDegrees: number;
  readonly idleWanderSpeedRadiansPerSec: number;
}

export interface FogTuning {
  readonly playerVisibilityRadius: number;
  readonly beamVisibilityRadius: number;
  readonly fogColor: number;
  readonly fogOpacity: number;
  readonly edgeSoftness: number;
  readonly ambientLightColor: number;
  readonly ambientLightOpacity: number;
  readonly lanternBeamColor: number;
  readonly lanternBeamIntensity: number;
  readonly lanternHaloColor: number;
  readonly lanternHaloIntensity: number;
}

export interface EnemyTuning {
  readonly stalkSpeed: number;
  readonly frozenSpeedMultiplier: number;
  readonly contactDamage: number;
  readonly repelledSpeed: number;
  readonly repelDurationMs: number;
  readonly detectionRadius: number;
  readonly width: number;
  readonly height: number;
}

export interface CheckpointTuning {
  readonly interactionRadius: number;
  readonly restHealAmount: number;
  readonly restRestoreLanterns: boolean;
}

export interface LevelTuning {
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly abyssY: number;
}

export interface GameConfig {
  readonly player: PlayerTuning;
  readonly lantern: LanternTuning;
  readonly fog: FogTuning;
  readonly enemy: EnemyTuning;
  readonly checkpoint: CheckpointTuning;
  readonly level: LevelTuning;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  player: {
    moveSpeed: 140,
    acceleration: 800,
    deceleration: 1000,
    jumpVelocity: -370,
    gravity: 920,
    maxLives: 3,
    staggerDurationMs: 1200,
    knockbackVelocityX: 160,
    knockbackVelocityY: -150,
    width: 26,
    height: 38,
  },
  lantern: {
    tingleDetectionRange: 360,
    focusDetectionRange: 220,
    idleIntensity: 0.25,
    maxIntensity: 1.0,
    maxBeamRange: 260,
    beamAngleDegrees: 34,
    heatPerSecond: 38,
    coolingPerSecond: 18,
    maxHeat: 100,
    enemyExposureRequiredMs: 1200,
    idleAngleLeftDegrees: 155,
    idleAngleRightDegrees: 25,
    swivelSpeedDegPerSec: 540,
    focusSwivelSpeedDegPerSec: 1400,
    idleOrbitRadius: 22,
    idleOrbitSpeedDegPerSec: 48,
    focusOrbitLerpSpeedDegPerSec: 720,
    idleWanderAmplitudeDegrees: 18,
    idleWanderSpeedRadiansPerSec: 1.8,
  },
  fog: {
    playerVisibilityRadius: 85,
    beamVisibilityRadius: 260,
    fogColor: 0x000000,
    fogOpacity: 1.0,
    edgeSoftness: 14,
    ambientLightColor: 0x000000,
    ambientLightOpacity: 1.0,
    lanternBeamColor: 0xe08a1e, // Warm golden amber (RGB: 224, 138, 30) - no pure white blowout
    lanternBeamIntensity: 0.12, // Subtly clamped illumination overlay (preserves native art contrast)
    lanternHaloColor: 0xd97706, // Deep warm amber (RGB: 217, 119, 6)
    lanternHaloIntensity: 0.08, // Gentle personal aura around the teddy bear
  },
  enemy: {
    stalkSpeed: 52,
    frozenSpeedMultiplier: 0.05,
    contactDamage: 1,
    repelledSpeed: 120,
    repelDurationMs: 400,
    detectionRadius: 360,
    width: 28,
    height: 34,
  },
  checkpoint: {
    interactionRadius: 48,
    restHealAmount: 3,
    restRestoreLanterns: true,
  },
  level: {
    worldWidth: 3200,
    worldHeight: 720,
    abyssY: 660,
  },
};

export function validateConfig(config: GameConfig): void {
  if (config.player.maxLives <= 0) {
    throw new Error(`[Config] player.maxLives must be > 0, got ${config.player.maxLives}`);
  }
  if (config.player.moveSpeed <= 0) {
    throw new Error(`[Config] player.moveSpeed must be > 0, got ${config.player.moveSpeed}`);
  }
  if (config.lantern.tingleDetectionRange <= 0) {
    throw new Error(`[Config] lantern.tingleDetectionRange must be > 0, got ${config.lantern.tingleDetectionRange}`);
  }
  if (
    config.lantern.focusDetectionRange <= 0 ||
    config.lantern.focusDetectionRange > config.lantern.tingleDetectionRange
  ) {
    throw new Error(
      `[Config] lantern.focusDetectionRange must be > 0 and <= tingleDetectionRange, got ${config.lantern.focusDetectionRange}`
    );
  }
  if (config.lantern.beamAngleDegrees <= 0 || config.lantern.beamAngleDegrees >= 180) {
    throw new Error(
      `[Config] lantern.beamAngleDegrees must be between (0, 180), got ${config.lantern.beamAngleDegrees}`
    );
  }
  if (config.lantern.heatPerSecond <= 0) {
    throw new Error(`[Config] lantern.heatPerSecond must be > 0, got ${config.lantern.heatPerSecond}`);
  }
  if (config.lantern.coolingPerSecond <= 0) {
    throw new Error(`[Config] lantern.coolingPerSecond must be > 0, got ${config.lantern.coolingPerSecond}`);
  }
  if (config.lantern.enemyExposureRequiredMs <= 0) {
    throw new Error(
      `[Config] lantern.enemyExposureRequiredMs must be > 0, got ${config.lantern.enemyExposureRequiredMs}`
    );
  }
  if (config.fog.playerVisibilityRadius <= 0) {
    throw new Error(
      `[Config] fog.playerVisibilityRadius must be > 0, got ${config.fog.playerVisibilityRadius}`
    );
  }
  if (config.fog.fogOpacity < 0 || config.fog.fogOpacity > 1) {
    throw new Error(
      `[Config] fog.fogOpacity must be between 0 and 1, got ${config.fog.fogOpacity}`
    );
  }
  if (config.fog.fogColor < 0) {
    throw new Error(`[Config] fog.fogColor must be >= 0, got ${config.fog.fogColor}`);
  }
  if (config.fog.edgeSoftness < 0) {
    throw new Error(`[Config] fog.edgeSoftness must be >= 0, got ${config.fog.edgeSoftness}`);
  }
  if (config.fog.ambientLightColor < 0) {
    throw new Error(`[Config] fog.ambientLightColor must be >= 0, got ${config.fog.ambientLightColor}`);
  }
  if (config.fog.ambientLightOpacity < 0 || config.fog.ambientLightOpacity > 1) {
    throw new Error(
      `[Config] fog.ambientLightOpacity must be between 0 and 1, got ${config.fog.ambientLightOpacity}`
    );
  }
  if (config.fog.lanternBeamIntensity < 0 || config.fog.lanternBeamIntensity > 1) {
    throw new Error(
      `[Config] fog.lanternBeamIntensity must be between 0 and 1, got ${config.fog.lanternBeamIntensity}`
    );
  }
  if (config.fog.lanternHaloIntensity < 0 || config.fog.lanternHaloIntensity > 1) {
    throw new Error(
      `[Config] fog.lanternHaloIntensity must be between 0 and 1, got ${config.fog.lanternHaloIntensity}`
    );
  }
  if (config.level.abyssY <= 0) {
    throw new Error(`[Config] level.abyssY must be > 0, got ${config.level.abyssY}`);
  }
}
