import * as Phaser from 'phaser';
import { DEFAULT_GAME_CONFIG, validateConfig } from '../config/GameConfig';
import { AssetLoader } from '../infrastructure/assets/AssetLoader';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // Validate configuration at startup as required by ARCHITECTURE.md
    validateConfig(DEFAULT_GAME_CONFIG);

    // Preload all vector SVG assets and Tiled maps
    AssetLoader.preloadAll(this);
  }

  public create(): void {
    // Transition to the main level session once assets are loaded
    this.scene.start('LevelScene');
  }
}
