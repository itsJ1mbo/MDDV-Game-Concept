import * as Phaser from 'phaser';
import { CheckpointStateSnapshot } from '../../domain/checkpoint/CheckpointTypes';
import { ASSET_KEYS } from '../../infrastructure/assets/AssetKeys';

export class CheckpointRenderer {
  private checkpointSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private promptText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.promptText = this.scene.add
      .text(0, 0, '[E] Rest at Bench', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '13px',
        color: '#ffea9f',
        backgroundColor: '#0a0a10cc',
        padding: { left: 6, right: 6, top: 3, bottom: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(95)
      .setVisible(false);
  }

  public update(
    _dtSeconds: number,
    checkpoints: readonly CheckpointStateSnapshot[],
    interactableId: string | null
  ): void {
    let foundInteractable = false;

    for (const cp of checkpoints) {
      const isCurrent = cp.isCurrentRespawn;
      const isInteractable = cp.id === interactableId;

      let sprite = this.checkpointSprites.get(cp.id);
      if (!sprite) {
        sprite = this.scene.add
          .sprite(cp.x, cp.y, ASSET_KEYS.CHECKPOINT_BENCH)
          .setDepth(45)
          .setOrigin(0.5, 0.9);
        this.checkpointSprites.set(cp.id, sprite);
      }

      // Texture swap based on whether this checkpoint is the active hearth
      const targetTexture = isCurrent
        ? ASSET_KEYS.CHECKPOINT_BENCH_LIT
        : ASSET_KEYS.CHECKPOINT_BENCH;

      if (sprite.texture.key !== targetTexture) {
        sprite.setTexture(targetTexture);
      }

      // Interaction prompt
      if (isInteractable) {
        foundInteractable = true;
        this.promptText
          .setPosition(cp.x, cp.y - 30)
          .setText(`[E] Rest at ${cp.name}`)
          .setVisible(true);
      }
    }

    if (!foundInteractable) {
      this.promptText.setVisible(false);
    }
  }

  public destroy(): void {
    for (const sprite of this.checkpointSprites.values()) {
      sprite.destroy();
    }
    this.checkpointSprites.clear();
    this.promptText.destroy();
  }
}
