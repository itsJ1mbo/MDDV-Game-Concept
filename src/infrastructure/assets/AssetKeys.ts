/**
 * Strongly-typed asset keys and path mappings for all game assets.
 * All vector SVG sprites, tilesets, and Tiled maps reside in /asset.
 */

export const ASSET_KEYS = {
  // Characters & Equipment
  PLAYER_BEAR: 'player_bear',
  LANTERN_IDLE: 'lantern_idle',
  LANTERN_ACTIVE: 'lantern_active',
  LANTERN_DESTROYED: 'lantern_destroyed',

  // Enemies & Particles
  SHADOW_STALKER: 'shadow_stalker',
  SHADOW_STALKER_EXPOSED: 'shadow_stalker_exposed',
  PARTICLE_EMBER: 'particle_ember',

  // Environment & Scenery
  CHECKPOINT_BENCH: 'checkpoint_bench',
  CHECKPOINT_BENCH_LIT: 'checkpoint_bench_lit',
  GOAL_DOOR: 'goal_door',
  BACKGROUND_ATTIC: 'background_attic',

  // UI
  HEART_FULL: 'heart_full',
  HEART_EMPTY: 'heart_empty',
  GAUGE_FRAME: 'gauge_frame',
  GAUGE_FILL: 'gauge_fill',
  BULB_ACTIVE: 'bulb_active',
  BULB_INACTIVE: 'bulb_inactive',

  // Tilesets
  ATTIC_TILESET: 'attic_tileset',

  // Tilemaps
  LEVEL_01_MAP: 'level_01',
} as const;

export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

export interface SvgAssetConfig {
  readonly key: string;
  readonly path: string;
  readonly width?: number;
  readonly height?: number;
}

export const SVG_ASSETS: readonly SvgAssetConfig[] = [
  // Characters
  {
    key: ASSET_KEYS.PLAYER_BEAR,
    path: 'asset/sprites/characters/player_bear.svg',
    width: 32,
    height: 44,
  },
  {
    key: ASSET_KEYS.LANTERN_IDLE,
    path: 'asset/sprites/characters/lantern_idle.svg',
    width: 16,
    height: 24,
  },
  {
    key: ASSET_KEYS.LANTERN_ACTIVE,
    path: 'asset/sprites/characters/lantern_active.svg',
    width: 20,
    height: 26,
  },
  {
    key: ASSET_KEYS.LANTERN_DESTROYED,
    path: 'asset/sprites/characters/lantern_destroyed.svg',
    width: 16,
    height: 24,
  },

  // Enemies & Particles
  {
    key: ASSET_KEYS.SHADOW_STALKER,
    path: 'asset/sprites/enemies/shadow_stalker.svg',
    width: 36,
    height: 36,
  },
  {
    key: ASSET_KEYS.SHADOW_STALKER_EXPOSED,
    path: 'asset/sprites/enemies/shadow_stalker_exposed.svg',
    width: 36,
    height: 36,
  },
  {
    key: ASSET_KEYS.PARTICLE_EMBER,
    path: 'asset/sprites/enemies/particle_ember.svg',
    width: 8,
    height: 8,
  },

  // Environment
  {
    key: ASSET_KEYS.CHECKPOINT_BENCH,
    path: 'asset/sprites/environment/checkpoint_bench.svg',
    width: 48,
    height: 32,
  },
  {
    key: ASSET_KEYS.CHECKPOINT_BENCH_LIT,
    path: 'asset/sprites/environment/checkpoint_bench_lit.svg',
    width: 56,
    height: 40,
  },
  {
    key: ASSET_KEYS.GOAL_DOOR,
    path: 'asset/sprites/environment/goal_door.svg',
    width: 100,
    height: 130,
  },
  {
    key: ASSET_KEYS.BACKGROUND_ATTIC,
    path: 'asset/sprites/environment/background_attic.svg',
    width: 1600,
    height: 600,
  },

  // UI
  {
    key: ASSET_KEYS.HEART_FULL,
    path: 'asset/sprites/ui/heart_full.svg',
    width: 24,
    height: 24,
  },
  {
    key: ASSET_KEYS.HEART_EMPTY,
    path: 'asset/sprites/ui/heart_empty.svg',
    width: 24,
    height: 24,
  },
  {
    key: ASSET_KEYS.GAUGE_FRAME,
    path: 'asset/sprites/ui/gauge_frame.svg',
    width: 170,
    height: 16,
  },
  {
    key: ASSET_KEYS.GAUGE_FILL,
    path: 'asset/sprites/ui/gauge_fill.svg',
    width: 166,
    height: 12,
  },
  {
    key: ASSET_KEYS.BULB_ACTIVE,
    path: 'asset/sprites/ui/bulb_active.svg',
    width: 14,
    height: 14,
  },
  {
    key: ASSET_KEYS.BULB_INACTIVE,
    path: 'asset/sprites/ui/bulb_inactive.svg',
    width: 14,
    height: 14,
  },

  // Tileset Image
  {
    key: ASSET_KEYS.ATTIC_TILESET,
    path: 'asset/tilesets/attic_tileset.svg',
    width: 160,
    height: 40,
  },
];

export const TILEMAP_ASSETS = [
  {
    key: ASSET_KEYS.LEVEL_01_MAP,
    path: 'asset/maps/level_01.json',
  },
] as const;
