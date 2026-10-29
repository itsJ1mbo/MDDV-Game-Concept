import * as Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { LevelScene } from '../scenes/LevelScene';

export function createGame(parentContainerId = 'juego'): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentContainerId,
    width: 960,
    height: 540,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, LevelScene],
  };

  return new Phaser.Game(config);
}
