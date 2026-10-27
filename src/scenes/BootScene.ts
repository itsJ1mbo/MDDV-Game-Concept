import * as Phaser from 'phaser';
import { DEFAULT_GAME_CONFIG, validateConfig } from '../config/GameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // Validate configuration at startup as required by ARCHITECTURE.md
    validateConfig(DEFAULT_GAME_CONFIG);
  }

  public create(): void {
    // Transition immediately to the main level session
    this.scene.start('LevelScene');
  }
}
