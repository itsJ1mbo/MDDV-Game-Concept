import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressionSystem } from '../src/systems/progression/ProgressionSystem';
import { CheckpointService } from '../src/domain/checkpoint/CheckpointService';
import { CheckpointModel } from '../src/domain/checkpoint/CheckpointModel';
import { PlayerModel } from '../src/domain/player/PlayerModel';
import { LanternModel } from '../src/domain/lantern/LanternModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';
import { LevelDefinition } from '../src/domain/level/LevelTypes';

describe('ProgressionSystem', () => {
  let progression: ProgressionSystem;
  let checkpointService: CheckpointService;
  let player: PlayerModel;
  let lanternLeft: LanternModel;
  let lanternRight: LanternModel;
  let testLevel: LevelDefinition;

  beforeEach(() => {
    checkpointService = new CheckpointService(DEFAULT_GAME_CONFIG.checkpoint);
    checkpointService.register(new CheckpointModel('cp-start', 'Start Point', 100, 200));

    progression = new ProgressionSystem(DEFAULT_GAME_CONFIG.level, checkpointService);
    player = new PlayerModel(100, 200, DEFAULT_GAME_CONFIG.player);
    lanternLeft = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);
    lanternRight = new LanternModel('right', DEFAULT_GAME_CONFIG.lantern);

    testLevel = {
      id: 'level-1',
      name: 'The Dark Attic',
      startX: 100,
      startY: 200,
      platforms: [],
      checkpoints: [{ id: 'cp-start', name: 'Start Point', x: 100, y: 200 }],
      enemySpawns: [],
      goalArea: { x: 900, y: 150, width: 60, height: 80 },
    };
  });

  it('triggers death and respawns player when falling into abyss', () => {
    // Player falls below abyssY (abyssY is 660)
    player.setPosition(200, 700);

    let died = false;
    let respawnX = 0;
    let respawnY = 0;

    progression.update(player, [lanternLeft, lanternRight], [], testLevel, {
      onPlayerDied: () => {
        died = true;
      },
      onPlayerRespawned: (x, y) => {
        respawnX = x;
        respawnY = y;
      },
    });

    expect(died).toBe(true);
    expect(respawnX).toBe(100);
    expect(respawnY).toBe(200);
    expect(player.isAlive()).toBe(true);
    expect(player.getState().lives).toBe(3);
  });

  it('detects goal completion when player enters goal area', () => {
    player.setPosition(920, 160);

    let goalReached = false;
    progression.update(player, [lanternLeft, lanternRight], [], testLevel, {
      onLevelCompleted: () => {
        goalReached = true;
      },
    });

    expect(goalReached).toBe(true);
    expect(progression.isLevelCompleted()).toBe(true);
  });
});
