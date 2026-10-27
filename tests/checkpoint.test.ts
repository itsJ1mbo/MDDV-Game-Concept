import { describe, it, expect, beforeEach } from 'vitest';
import { CheckpointModel } from '../src/domain/checkpoint/CheckpointModel';
import { CheckpointService } from '../src/domain/checkpoint/CheckpointService';
import { PlayerModel } from '../src/domain/player/PlayerModel';
import { LanternModel } from '../src/domain/lantern/LanternModel';
import { DEFAULT_GAME_CONFIG } from '../src/config/GameConfig';

describe('CheckpointService', () => {
  let service: CheckpointService;
  let player: PlayerModel;
  let lanternLeft: LanternModel;
  let lanternRight: LanternModel;

  beforeEach(() => {
    service = new CheckpointService(DEFAULT_GAME_CONFIG.checkpoint);
    player = new PlayerModel(50, 100, DEFAULT_GAME_CONFIG.player);
    lanternLeft = new LanternModel('left', DEFAULT_GAME_CONFIG.lantern);
    lanternRight = new LanternModel('right', DEFAULT_GAME_CONFIG.lantern);

    service.register(new CheckpointModel('cp-1', 'Attic Trunk', 100, 100));
    service.register(new CheckpointModel('cp-2', 'Sewing Table', 500, 100));
  });

  it('determines nearest checkpoint correctly', () => {
    const nearFirst = service.getNearestCheckpoint(150, 100);
    expect(nearFirst?.id).toBe('cp-1');

    const nearSecond = service.getNearestCheckpoint(480, 100);
    expect(nearSecond?.id).toBe('cp-2');
  });

  it('detects interactable checkpoint when player is within radius', () => {
    const interactable = service.getInteractableCheckpoint(120, 100);
    expect(interactable?.id).toBe('cp-1');

    const notInRange = service.getInteractableCheckpoint(250, 100);
    expect(notInRange).toBeNull();
  });

  it('rest restores damaged player to max lives', () => {
    player.takeDamage(2, 0);
    expect(player.getState().lives).toBe(1);

    const result = service.restAt('cp-1', player, [lanternLeft, lanternRight]);
    expect(result.success).toBe(true);
    expect(player.getState().lives).toBe(3);
  });

  it('rest restores exploded lanterns to functional state', () => {
    lanternLeft.explode();
    lanternRight.update(1.0, null, false); // generate some heat or state
    expect(lanternLeft.getState().isDestroyed).toBe(true);

    const result = service.restAt('cp-1', player, [lanternLeft, lanternRight]);
    expect(result.lanternsRestored).toBe(true);
    expect(lanternLeft.getState().isDestroyed).toBe(false);
    expect(lanternLeft.getState().heat).toBe(0);
  });

  it('sets the rested checkpoint as current respawn point', () => {
    service.restAt('cp-2', player, [lanternLeft, lanternRight]);
    const respawn = service.getActiveRespawnPoint();
    expect(respawn.x).toBe(500);
    expect(respawn.y).toBe(100);
  });
});
