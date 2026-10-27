# Agent Instructions

## Project context

This repository contains the design documentation for a 2D atmospheric platformer about a lost teddy bear trying to return home through a hostile world of darkness. The authoritative game vision is in `DESIGN.md`.

## Technology requirements

- The game must be implemented with **Phaser 4**.
- The game must be written in **TypeScript**.
- Prefer strict TypeScript settings and explicit domain types over `any` or unchecked casts.
- Keep engine-specific code at the edges of the game. Gameplay rules should be testable without requiring a rendered scene whenever practical.

## Implementation rules

- Read `DESIGN.md` before changing gameplay, level flow, enemies, lighting, or narrative presentation.
- Put tunable gameplay values in typed configuration/data objects, not scattered magic numbers.
- Make balance changes possible without editing core systems. Designers should be able to adjust movement, health, detection, beam, heat, enemy, checkpoint, fog, and camera values from a clearly named configuration location.
- Keep player state, lantern state, enemy state, checkpoint state, and level progression explicit. Avoid hidden coupling through scene globals.
- Use events or well-defined interfaces for cross-system communication, such as damage, enemy detection, lantern overheating, death, respawn, and resting.
- Preserve deterministic and predictable update order: input, movement/physics, sensing, combat, heat, enemy behavior, then presentation.
- Separate simulation from presentation. Visual effects, lights, particles, camera shake, and audio should respond to gameplay state rather than own it.
- Handle failure states explicitly. Do not silently ignore invalid configuration, missing assets, or impossible state transitions.
- Prefer small, focused systems and composition over large scene classes.
- Keep public APIs and data contracts documented when a system is shared by multiple scenes.

## Asset management

- Store every runtime asset under the repository root `asset/` directory. Do not add new runtime assets under `assets/`, `docs/`, or generated build output.
- Organize assets by role: `asset/sprites/characters/`, `asset/sprites/enemies/`, `asset/sprites/environment/`, `asset/sprites/ui/`, `asset/tilesets/`, and `asset/maps/`.
- Use SVG for every sprite, UI image, environment image, particle image, and tileset image. Do not add raster sprite files or embed raster images inside SVG files.
- Use editable Tiled JSON maps in `asset/maps/`. Gameplay level objects, spawn points, checkpoints, enemies, goals, and collision geometry belong in the map rather than being recreated in scene code.
- Use lowercase `snake_case` names with stable semantic prefixes where useful, such as `player_bear.svg`, `shadow_stalker.svg`, `attic_tileset.svg`, and `level_01.json`.
- Register asset paths and keys centrally in `src/infrastructure/assets/AssetKeys.ts`, and load them through `AssetLoader`; do not scatter literal asset paths through scenes or renderers.
- Do not generate artwork with Phaser geometry. `Phaser.GameObjects.Graphics` may only be used for non-artistic runtime presentation effects when no asset-backed alternative is appropriate; it must not replace a sprite, environment image, UI image, particle, tileset, or level artwork.
- Keep asset loading errors explicit and actionable. Missing assets or invalid Tiled references must not silently fall back to generated shapes or placeholder success states.

## Phaser guidance

- Scenes coordinate lifecycle and composition; they should not contain all gameplay rules.
- Use Phaser physics and rendering features through adapters or focused components where that improves testability.
- Treat fog, beam cones, and lighting as presentation driven by authoritative gameplay queries. Rendering must not decide whether an enemy is damaged.
- Reuse entities and effects where appropriate, but do not pool objects in a way that obscures lifecycle or state reset requirements.
- Ensure every respawn and checkpoint-rest restore fully resets transient state, including enemy exposure progress, stagger state, active beams, and heat timers.

## Validation expectations

For gameplay changes, verify at least:

- movement, jumping, collisions, and falling into an abyss;
- three-life damage, stagger, death, and nearest-checkpoint respawn;
- passive lantern threat sensing without fog removal;
- active beam aiming, fog carving, continuous enemy exposure, and interrupted exposure reset;
- independent lantern heat, cooling, explosion, and checkpoint restoration;
- resting at a checkpoint and restoring health and destroyed lanterns.

For documentation or configuration changes, check that the relevant value has one clear source of truth and that its units and intended range are understandable.

## Change discipline

- Keep changes focused on the requested behavior.
- Do not commit generated build output, secrets, or local configuration.
- Update architecture or agent documentation when an implementation introduces a new cross-system dependency or changes a core gameplay rule or when DESIGN.md changes.
