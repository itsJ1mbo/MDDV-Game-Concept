import * as Phaser from 'phaser';
import { DEFAULT_GAME_CONFIG } from '../config/GameConfig';
import { CheckpointModel } from '../domain/checkpoint/CheckpointModel';
import { CheckpointService } from '../domain/checkpoint/CheckpointService';
import { EnemyModel } from '../domain/enemy/EnemyModel';
import { LanternModel } from '../domain/lantern/LanternModel';
import { LEVEL_1 } from '../domain/level/DefaultLevel';
import { LevelDefinition } from '../domain/level/LevelTypes';
import { PlayerModel } from '../domain/player/PlayerModel';
import { InputManager } from '../infrastructure/input/InputManager';
import { SoundSynthesizer } from '../presentation/audio/SoundSynthesizer';
import { CheckpointRenderer } from '../presentation/checkpoint/CheckpointRenderer';
import { EnemyRenderer } from '../presentation/enemies/EnemyRenderer';
import { FogRenderer } from '../presentation/lighting/FogRenderer';
import { PlayerRenderer } from '../presentation/player/PlayerRenderer';
import { GameHud } from '../presentation/ui/GameHud';
import { BeamCombatSystem } from '../systems/combat/BeamCombatSystem';
import { ProgressionSystem } from '../systems/progression/ProgressionSystem';
import { ThreatSensingSystem } from '../systems/sensing/ThreatSensingSystem';

export class LevelScene extends Phaser.Scene {
  // Domain Models
  private player!: PlayerModel;
  private lanterns!: [LanternModel, LanternModel];
  private enemies: EnemyModel[] = [];
  private checkpointService!: CheckpointService;
  private level: LevelDefinition = LEVEL_1;

  // Systems
  private sensingSystem!: ThreatSensingSystem;
  private combatSystem!: BeamCombatSystem;
  private progressionSystem!: ProgressionSystem;

  // Presentation & Infrastructure
  private inputManager!: InputManager;
  private audio!: SoundSynthesizer;
  private fogRenderer!: FogRenderer;
  private playerRenderer!: PlayerRenderer;
  private enemyRenderer!: EnemyRenderer;
  private checkpointRenderer!: CheckpointRenderer;
  private hud!: GameHud;

  // Level Visuals
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private platformGraphics!: Phaser.GameObjects.Graphics;
  private goalGraphics!: Phaser.GameObjects.Graphics;

  // Audio & State tracking
  private footstepTimer = 0;
  private wasGroundedLastFrame = false;
  private previousLanternState: [boolean, boolean] = [false, false]; // exploded tracking
  private isPaused = false;

  constructor() {
    super({ key: 'LevelScene' });
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Initialize Domain
    this.player = new PlayerModel(
      this.level.startX,
      this.level.startY,
      DEFAULT_GAME_CONFIG.player
    );
    this.lanterns = [
      new LanternModel('left', DEFAULT_GAME_CONFIG.lantern),
      new LanternModel('right', DEFAULT_GAME_CONFIG.lantern),
    ];

    this.checkpointService = new CheckpointService(DEFAULT_GAME_CONFIG.checkpoint);
    for (const cp of this.level.checkpoints) {
      this.checkpointService.register(
        new CheckpointModel(cp.id, cp.name, cp.x, cp.y)
      );
    }

    // Spawn enemies
    this.enemies = this.level.enemySpawns.map(
      (sp) =>
        new EnemyModel(
          sp.id,
          sp.x,
          sp.y,
          DEFAULT_GAME_CONFIG.enemy,
          DEFAULT_GAME_CONFIG.lantern
        )
    );

    // 2. Initialize Systems
    this.sensingSystem = new ThreatSensingSystem(DEFAULT_GAME_CONFIG.lantern);
    this.combatSystem = new BeamCombatSystem(
      DEFAULT_GAME_CONFIG.lantern,
      DEFAULT_GAME_CONFIG.enemy
    );
    this.progressionSystem = new ProgressionSystem(
      DEFAULT_GAME_CONFIG.level,
      this.checkpointService
    );

    // 3. Initialize Presentation & Infrastructure
    this.inputManager = new InputManager();
    this.audio = new SoundSynthesizer();

    this.backgroundGraphics = this.add.graphics().setDepth(5);
    this.platformGraphics = this.add.graphics().setDepth(20);
    this.goalGraphics = this.add.graphics().setDepth(25);

    this.playerRenderer = new PlayerRenderer(this);
    this.enemyRenderer = new EnemyRenderer(this);
    this.checkpointRenderer = new CheckpointRenderer(this);
    this.fogRenderer = new FogRenderer(
      this,
      DEFAULT_GAME_CONFIG.fog,
      DEFAULT_GAME_CONFIG.lantern,
      width,
      height
    );
    this.hud = new GameHud(this, width, height);

    // 4. Render Level Scenery
    this.renderLevelScenery();

    // 5. Setup Camera
    this.cameras.main.setBounds(
      0,
      0,
      DEFAULT_GAME_CONFIG.level.worldWidth,
      DEFAULT_GAME_CONFIG.level.worldHeight
    );
    this.cameras.main.startFollow(
      {
        x: this.level.startX,
        y: this.level.startY,
      } as unknown as Phaser.GameObjects.GameObject,
      false,
      0.08,
      0.08
    );

    // Interaction audio trigger
    this.input.on('pointerdown', () => this.audio.userInteracted());
    window.addEventListener('keydown', () => this.audio.userInteracted(), {
      once: true,
    });
  }

  private renderLevelScenery(): void {
    // Backdrop: Eerie nursery/attic silhouettes
    this.backgroundGraphics.clear();
    const w = DEFAULT_GAME_CONFIG.level.worldWidth;
    const h = DEFAULT_GAME_CONFIG.level.worldHeight;

    // Gradient background
    this.backgroundGraphics.fillGradientStyle(
      0x05060a,
      0x05060a,
      0x020205,
      0x020205,
      1
    );
    this.backgroundGraphics.fillRect(0, 0, w, h);

    // Background silhouettes: oversized wooden shelves, wallpaper seams, giant clock, needles
    this.backgroundGraphics.fillStyle(0x0a0c14, 0.7);
    this.backgroundGraphics.fillRect(0, 0, w, 80);

    // Giant grandfather clock silhouette in distance
    this.backgroundGraphics.fillStyle(0x0c0e18, 0.45);
    this.backgroundGraphics.fillRect(800, 100, 120, 400);
    this.backgroundGraphics.fillCircle(860, 140, 40);

    // Giant books and spool silhouettes
    this.backgroundGraphics.fillRect(1500, 120, 80, 240);
    this.backgroundGraphics.fillRect(1590, 150, 70, 210);

    // Giant carved toy chest silhouette
    this.backgroundGraphics.fillRect(2120, 260, 220, 140);

    // Solid Platforms: weathered dark wooden planks
    this.platformGraphics.clear();
    for (const p of this.level.platforms) {
      // Wood plank base
      this.platformGraphics.fillStyle(0x221a14, 1);
      this.platformGraphics.fillRoundedRect(p.x, p.y, p.width, p.height, 4);

      // Plank top highlight
      this.platformGraphics.fillStyle(0x403125, 1);
      this.platformGraphics.fillRect(p.x + 2, p.y, p.width - 4, 3);

      // Plank edge bolts / brackets
      this.platformGraphics.fillStyle(0x130e0b, 1);
      this.platformGraphics.fillCircle(p.x + 8, p.y + p.height / 2, 2.5);
      this.platformGraphics.fillCircle(p.x + p.width - 8, p.y + p.height / 2, 2.5);
    }

    // Goal Doorway: Warm golden bedroom door at end of level
    const goal = this.level.goalArea;
    this.goalGraphics.clear();
    // Warm light radiating around door
    this.goalGraphics.fillStyle(0xffe488, 0.18);
    this.goalGraphics.fillCircle(
      goal.x + goal.width / 2,
      goal.y + goal.height / 2,
      120
    );

    // Door frame
    this.goalGraphics.fillStyle(0x4a3420, 1);
    this.goalGraphics.fillRoundedRect(goal.x, goal.y, goal.width, goal.height, 6);

    // Open door slit spilling brilliant light
    this.goalGraphics.fillStyle(0xfff7cc, 0.95);
    this.goalGraphics.fillRect(goal.x + 12, goal.y + 10, goal.width - 24, goal.height - 10);

    // Golden rays
    this.goalGraphics.lineStyle(2, 0xffe277, 0.6);
    this.goalGraphics.lineBetween(goal.x + 20, goal.y + 40, goal.x - 40, goal.y + 20);
    this.goalGraphics.lineBetween(goal.x + 20, goal.y + 80, goal.x - 60, goal.y + 90);
  }

  public update(_time: number, delta: number): void {
    const dtSeconds = Math.min(0.1, delta / 1000);

    // 1. Capture input snapshot
    const input = this.inputManager.getSnapshot();

    // Debug toggle
    if (input.toggleDebug) {
      this.hud.toggleDebug();
    }

    // Pause toggle
    if (input.togglePause) {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.hud.showNotification('GAME PAUSED (Press [Esc] or [P] to Resume)');
        return;
      } else {
        this.hud.showNotification('RESUMED', 1);
      }
    }

    if (this.isPaused) return;

    // 2. Update player movement and physics
    this.player.update(input, dtSeconds, this.level.platforms);
    const playerState = this.player.getState();

    // Smooth camera target
    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Linear(
      cam.scrollX,
      playerState.x - cam.width / 2,
      0.08
    );
    cam.scrollY = Phaser.Math.Linear(
      cam.scrollY,
      playerState.y - cam.height / 2,
      0.08
    );

    // 3. Update enemies movement towards player
    for (const enemy of this.enemies) {
      enemy.update(dtSeconds, playerState.x, playerState.y);
    }

    // 4. Sensing System: query nearby enemies for each lantern
    const sensed = this.sensingSystem.update(
      this.player,
      this.lanterns,
      this.enemies
    );

    // 5. Update lantern state (swivel, beam requests, heat, cooling, explosion)
    this.lanterns[0].update(dtSeconds, sensed.leftTarget, input.requestBeamLeft);
    this.lanterns[1].update(dtSeconds, sensed.rightTarget, input.requestBeamRight);

    // 6. Combat System: resolve active beam exposure and enemy contact
    this.combatSystem.update(
      dtSeconds,
      this.player,
      this.lanterns,
      this.enemies,
      {
        onEnemyDestroyed: (enemyId) => {
          const enemy = this.enemies.find((e) => e.id === enemyId);
          if (enemy) {
            this.enemyRenderer.spawnDisintegrationBurst(
              enemy.getState().x,
              enemy.getState().y
            );
          }
          this.audio.playEnemyDisintegrated();
        },
        onPlayerDamaged: (livesRemaining) => {
          this.audio.playPlayerHurt();
          this.cameras.main.shake(180, 0.012);
          this.hud.showNotification(`Teddy was struck! Lives remaining: ${livesRemaining}`, 2);
        },
      }
    );

    // 7. Checkpoint rest interaction
    const interactableCp = this.checkpointService.getInteractableCheckpoint(
      playerState.x,
      playerState.y
    );
    if (interactableCp && input.requestRest) {
      const restResult = this.checkpointService.restAt(
        interactableCp.id,
        this.player,
        this.lanterns
      );
      if (restResult.success) {
        this.audio.playCheckpointRest();
        this.hud.showNotification(restResult.message, 3.5);
      }
    }

    // 8. Progression System (abyss, death, respawn, goal)
    this.progressionSystem.update(
      this.player,
      this.lanterns,
      this.enemies,
      this.level,
      {
        onPlayerDied: () => {
          this.audio.playPlayerHurt();
          this.hud.showNotification('Teddy fell into the dark! Respawning at checkpoint...', 2.5);
        },
        onPlayerRespawned: () => {
          this.cameras.main.flash(250, 20, 20, 30);
        },
        onLevelCompleted: () => {
          this.audio.playCheckpointRest();
          this.hud.showNotification(
            'Teddy reached the Bedroom Door! Safe at last!',
            10
          );
        },
      }
    );

    // 9. Sound Effects & Audio state updates
    this.updateAudioFeedback(dtSeconds, input);

    // 10. Update Presentation Layers
    const lanternStates: [any, any] = [
      this.lanterns[0].getState(),
      this.lanterns[1].getState(),
    ];

    this.playerRenderer.update(dtSeconds, this.player.getState(), lanternStates);
    this.enemyRenderer.update(
      dtSeconds,
      this.enemies.map((e) => e.getState())
    );
    this.checkpointRenderer.update(
      dtSeconds,
      this.checkpointService.getCheckpoints().map((c) => c.getState()),
      interactableCp?.id ?? null
    );
    this.fogRenderer.update(playerState.x, playerState.y, lanternStates);
    this.hud.update(
      dtSeconds,
      this.player.getState(),
      lanternStates,
      this.enemies.filter((e) => !e.isDestroyed()).length
    );
  }

  private updateAudioFeedback(
    dtSeconds: number,
    input: { jump: boolean; moveX: number }
  ): void {
    const playerState = this.player.getState();

    // Footsteps
    if (
      playerState.isGrounded &&
      Math.abs(playerState.vx) > 15 &&
      !playerState.isStaggered
    ) {
      this.footstepTimer += dtSeconds;
      if (this.footstepTimer >= 0.32) {
        this.footstepTimer = 0;
        this.audio.playFootstep();
      }
    } else {
      this.footstepTimer = 0.28;
    }

    // Jump audio
    if (input.jump && this.wasGroundedLastFrame && !playerState.isGrounded) {
      this.audio.playJump();
    }
    // Landing audio
    if (!this.wasGroundedLastFrame && playerState.isGrounded) {
      this.audio.playLanding();
    }
    this.wasGroundedLastFrame = playerState.isGrounded;

    // Beam active sound
    const anyBeamActive =
      this.lanterns[0].getState().isBeamActive ||
      this.lanterns[1].getState().isBeamActive;
    const highestHeat = Math.max(
      this.lanterns[0].getState().heat / DEFAULT_GAME_CONFIG.lantern.maxHeat,
      this.lanterns[1].getState().heat / DEFAULT_GAME_CONFIG.lantern.maxHeat
    );
    this.audio.setBeamSoundActive(anyBeamActive, highestHeat);

    // Lantern explosion sounds
    const l0Exploded = this.lanterns[0].getState().isDestroyed;
    const l1Exploded = this.lanterns[1].getState().isDestroyed;
    if (l0Exploded && !this.previousLanternState[0]) {
      this.audio.playLanternExplosion();
      this.cameras.main.shake(250, 0.02);
      this.hud.showNotification('LEFT LANTERN OVERHEATED AND EXPLODED!', 3);
    }
    if (l1Exploded && !this.previousLanternState[1]) {
      this.audio.playLanternExplosion();
      this.cameras.main.shake(250, 0.02);
      this.hud.showNotification('RIGHT LANTERN OVERHEATED AND EXPLODED!', 3);
    }
    this.previousLanternState = [l0Exploded, l1Exploded];
  }

  public shutdown(): void {
    this.inputManager.destroy();
    this.fogRenderer.destroy();
    this.playerRenderer.destroy();
    this.enemyRenderer.destroy();
    this.checkpointRenderer.destroy();
    this.hud.destroy();
  }
}
