import * as Phaser from 'phaser';
import { PlayerStateSnapshot } from '../../domain/player/PlayerTypes';
import { ASSET_KEYS } from '../../infrastructure/assets/AssetKeys';

export class GameHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly heartImages: Phaser.GameObjects.Image[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(110);

    for (let i = 0; i < 3; i++) {
      const heartImage = this.scene.add
        .image(30 + i * 28, 26, ASSET_KEYS.HEART_FULL)
        .setOrigin(0.5, 0.5);
      this.heartImages.push(heartImage);
      this.container.add(heartImage);
    }
  }

  public update(player: PlayerStateSnapshot): void {
    for (let i = 0; i < this.heartImages.length; i++) {
      const targetTexture =
        i < player.lives ? ASSET_KEYS.HEART_FULL : ASSET_KEYS.HEART_EMPTY;

      if (this.heartImages[i].texture.key !== targetTexture) {
        this.heartImages[i].setTexture(targetTexture);
      }
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
