# Game Architecture

## Purpose and scope

This document defines the target architecture for the game described in `DESIGN.md`: a 2D side-scrolling atmospheric platformer built with **Phaser 4** and **TypeScript**. New game code should be organized around the domains and boundaries below.

## Architectural goals

- Make the fog, lanterns, enemies, checkpoints, and movement reliable as a cohesive gameplay loop.
- Keep rules independent from rendering so core behavior can be tested and tuned safely.
- Keep Phaser 4 integration localized to scenes, adapters, input, physics, rendering, audio, and asset loading.
- Make every important gameplay parameter easy to find and change from a design perspective so iteration is fast.
- Make state transitions explicit and recoverable, especially death, respawn, resting, lantern destruction, and level transitions.

## High-level runtime structure

```text
Boot
  -> Asset/Config Loading
  -> Main Menu or Game Session
       -> Level Scene
            -> World/Physics
            -> Player
                 -> Movement
                 -> Health and Stagger
                 -> Lanterns
            -> Fog and Light Presentation
            -> Enemy Director and Enemies
            -> Checkpoints
            -> Camera, Audio, and Effects
       -> Pause / Results / Transition
```

Scenes own lifecycle, composition, and transitions. Domain systems own rules. Renderers and effects visualize state but never become the authority for damage, heat, detection, or progression.

## Asset architecture

All runtime assets are owned by the repository-level `asset/` directory:

```text
asset/
  maps/                    editable Tiled JSON maps
  sprites/
    characters/            player and lantern sprites
    enemies/               enemy and particle sprites
    environment/           background and world props
    ui/                    HUD and status images
  tilesets/                SVG tileset images referenced by Tiled maps
```

Asset rules:

- Every sprite, UI image, environment image, particle image, and tileset image is an SVG. Raster images and raster content embedded in SVG files are not part of the runtime asset pipeline.
- Levels are authored as Tiled JSON files under `asset/maps/`. Tile layers contain visual terrain, while object layers contain typed gameplay data such as player spawns, platforms, enemies, checkpoints, and goals.
- Tiled maps may reference only assets in the neighboring `asset/` hierarchy using stable relative paths. The map loader converts authored objects into typed domain definitions; scenes must not duplicate those level entities as hard-coded geometry.
- Asset keys and paths are declared in `src/infrastructure/assets/AssetKeys.ts` and loaded by `src/infrastructure/assets/AssetLoader.ts`. Presentation code consumes asset keys rather than literal file paths.
- Use lowercase `snake_case` filenames and stable semantic names. Examples include `player_bear.svg`, `lantern_active.svg`, `shadow_stalker_exposed.svg`, `attic_tileset.svg`, and `level_01.json`.
- Do not use Phaser geometry generation as an asset substitute. Runtime `Graphics` objects may support transient presentation effects such as fog masks or beam overlays, but must not draw sprites, props, UI artwork, particles, tiles, or level terrain that should be authored as assets.

## Module boundaries

The exact directory names may evolve, but responsibilities should remain separate:

```text
src/
  bootstrap/       Phaser game configuration and startup
  scenes/          Boot, menu, level, pause, transition, and results scenes
  config/          Typed design-time configuration and level definitions
  domain/
    player/        movement, health, stagger, respawn state
    lantern/       passive sensing, active beams, heat, explosion, restoration
    enemy/         enemy state, stalking, exposure, destruction
    checkpoint/    activation, nearest checkpoint, resting and restore
    level/         progression, hazards, spawn regions, and level state
  systems/
    combat/        beam target selection and exposure resolution
    sensing/       threat queries and lantern targeting
    fog/           visibility queries and fog presentation inputs
    progression/   death, respawn, rest, and scene transitions
  presentation/
    player/        sprites, animation, lantern mounts
    lighting/      fog, passive glow, beam cones, shadows
    enemies/       enemy visuals and disintegration effects
    ui/             life, heat, checkpoint, and pause feedback
    audio/          music, ambience, cues, and one-shot effects
  infrastructure/
    input/         action mapping and device adapters
    physics/       Phaser physics adapters
    assets/        asset keys, paths, and loading contracts for /asset
```

New code should preserve these boundaries rather than growing a monolithic scene.

## Core gameplay model

### Player

The player is composed of movement, health, stagger, and lantern modules. A player update should consume an input snapshot and world queries, then produce explicit state changes:

1. Resolve movement and jumping.
2. Apply physics and collision results.
3. Resolve hazards and enemy contact.
4. Update lantern sensing and beam requests.
5. Update health, stagger, heat, and death transitions.
6. Publish state for presentation and audio.

The player has three life points by default. Enemy contact removes one life and staggers the player. Falling into an abyss or reaching zero life enters the death flow and respawns at the nearest active checkpoint.

### Lanterns

Each lantern is an independent state machine:

```text
Idle -> Sensing -> ActiveBeam -> Cooling
  \                         \
   -> Destroyed <------------ Overheated
```

The passive radar target is the nearest eligible enemy in detection range. It changes direction and intensity but must not reveal or clear the fog.

An active beam is allowed only when a valid target exists. It aims automatically at the nearest eligible enemy, carves fog in the beam cone, and applies exposure while the enemy remains inside the cone. Exposure progress is continuous and resets immediately when the beam stops or loses the target, as specified by the design.

Heat belongs to the lantern, not the player. Holding its action increases heat; releasing it cools it more slowly. Reaching maximum heat transitions the lantern to `Destroyed`, disabling its sensing/combat contribution until a checkpoint rest restores it.

### Fog and lighting

Fog presentation is derived from gameplay queries:

- The player has a small local visibility radius.
- Passive lantern radar changes direction/intensity only and does not clear fog.
- An active beam adds an acute, directional visibility cone.
- The beam cone and its gameplay target must use the same origin, angle, range, and spread configuration to avoid visual/gameplay disagreement.

The fog renderer may use render textures, masks, lights, or another Phaser 4 technique, but the choice must not alter the authoritative gameplay queries.

### Enemies

The basic shadow enemy spawns outside the player's fog and stalks toward the player. Enemy behavior should use a small explicit state model such as `Spawning`, `Stalking`, `Exposed`, and `Destroyed`.

Enemies are unaffected by passive radar glow. Active beams apply exposure only while the enemy is inside the beam's configured cone. Once exposure reaches its threshold, the enemy is destroyed. Interrupted exposure resets immediately rather than persisting.

### Checkpoints and rest

A checkpoint stores the player's respawn transform and level progress. Activating or resting at a checkpoint should:

- restore all three life points;
- restore any destroyed lantern;
- establish the checkpoint as the nearest valid respawn point;
- clear transient combat and damage state;
- preserve intended level progression and activated checkpoint state.

Checkpoint restoration should be implemented as an explicit service/command, not as side effects distributed across player and lantern classes.

## Configuration and fast design iteration

**Every parameter that affects feel, balance, pacing, visibility, or difficulty must be easy to access and change from a design perspective.** Designers should not need to search through scene logic or rendering code to tune the game.

Use typed, named configuration grouped by design concern:

```ts
export interface PlayerTuning {
  moveSpeed: number;
  acceleration: number;
  deceleration: number;
  jumpVelocity: number;
  maxLives: number;
  staggerDurationMs: number;
}

export interface LanternTuning {
  detectionRange: number;
  idleIntensity: number;
  maxBeamRange: number;
  beamAngleDegrees: number;
  heatPerSecond: number;
  coolingPerSecond: number;
  maxHeat: number;
  enemyExposureRequiredMs: number;
}

export interface FogTuning {
  playerVisibilityRadius: number;
  beamVisibilityRadius: number;
  fogColor: number;
  fogOpacity: number;
}
```

Recommended rules for tuning data:

- Keep defaults in one discoverable configuration directory.
- Use meaningful names and explicit units in names or documentation (`Ms`, `Degrees`, `PerSecond`).
- Separate global defaults from per-level overrides.
- Allow enemy, checkpoint, and level-specific overrides without changing systems.
- Validate configuration at startup and fail with an actionable error for invalid ranges.
- Do not duplicate a value in both a system and a scene.
- Prefer data objects that can later be loaded from JSON or an editor without changing gameplay code.
- Keep debug controls available in development builds to inspect detection ranges, beam cones, heat, exposure, and checkpoint state.

The configuration layer is a design interface. It should be the first place a designer looks when adjusting movement feel, lantern risk, fog density, enemy pressure, or checkpoint generosity.

## Update and communication flow

Use a predictable frame flow:

1. Capture player input into an immutable action snapshot.
2. Update player movement and Phaser physics.
3. Query nearby enemies for passive sensing and beam targeting.
4. Resolve active beam exposure and enemy contact.
5. Update lantern heat/cooling and state transitions.
6. Resolve death, respawn, rest, and checkpoint commands.
7. Publish a read-only gameplay snapshot.
8. Update sprites, fog, lights, UI, camera, particles, and audio from that snapshot.

Systems may communicate through typed commands and events such as:

- `EnemyDetected`
- `BeamStarted` / `BeamStopped`
- `EnemyExposureChanged`
- `EnemyDestroyed`
- `LanternOverheated`
- `PlayerDamaged`
- `PlayerDied`
- `PlayerRespawned`
- `CheckpointRestored`

Events describe completed facts; commands request state changes. Avoid event chains where one visual effect is responsible for triggering gameplay.

## Scene and persistence strategy

- `BootScene` loads only startup dependencies and validates configuration.
- `LevelScene` composes one level session and owns its level-local systems.
- `PauseScene` or an equivalent overlay freezes simulation without destroying the level session.
- Transition logic preserves only the intended session/checkpoint data and does not rely on Phaser scene object references surviving unexpectedly.
- A level session owns current checkpoint, player progression, active enemies, and level-specific tuning overrides.
- Save/persistence is a separate concern and should be introduced only when the game design requires it.

## Testing strategy

Prioritize deterministic tests for domain systems:

- movement and jump calculations;
- life loss, stagger, death, and respawn;
- passive detection target selection;
- beam eligibility and target selection;
- exposure reset when a beam stops or target leaves the cone;
- heat increase, cooling, maximum heat, and destruction;
- checkpoint rest restoring health and lanterns.

Use Phaser integration tests or focused manual test scenes for physics, render textures, fog masks, camera behavior, animation, audio, and asset loading. Keep a small debug level with visible fog boundaries, beam cones, enemy detection ranges, heat values, and checkpoint locations.

## Performance and reliability

- Query nearby enemies using spatial filtering rather than scanning every enemy for every lantern when population grows.
- Avoid creating transient render or audio objects every frame.
- Reuse effects only when their reset behavior is explicit and tested.
- Keep the authoritative simulation independent from frame-rate-dependent visual interpolation.
- Clamp or validate externally supplied configuration before it enters gameplay systems.
- Ensure entity cleanup on scene shutdown so enemies, listeners, timers, and effects do not leak into later levels.

## Architectural decision rule

When a change makes a feature easier to render but harder to tune, test, or reason about, prefer the design that keeps gameplay state authoritative, configuration centralized, and presentation replaceable.
