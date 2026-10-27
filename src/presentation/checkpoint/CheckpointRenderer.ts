import * as Phaser from 'phaser';
import { CheckpointStateSnapshot } from '../../domain/checkpoint/CheckpointTypes';

export class CheckpointRenderer {
  private graphics: Phaser.GameObjects.Graphics;
  private promptText: Phaser.GameObjects.Text;
  private animTimer = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.graphics = this.scene.add.graphics().setDepth(45);
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
    dtSeconds: number,
    checkpoints: readonly CheckpointStateSnapshot[],
    interactableId: string | null
  ): void {
    this.animTimer += dtSeconds * 3;
    this.graphics.clear();

    let foundInteractable = false;

    for (const cp of checkpoints) {
      const isCurrent = cp.isCurrentRespawn;
      const isInteractable = cp.id === interactableId;

      // Draw Bench / Cushion base
      this.graphics.fillStyle(0x382618, 1);
      this.graphics.fillRoundedRect(cp.x - 18, cp.y - 4, 36, 12, 3);

      this.graphics.fillStyle(0x5a3d24, 1);
      this.graphics.fillRoundedRect(cp.x - 16, cp.y - 8, 32, 6, 2);

      // Warm Campfire / Hearth Lantern on bench
      const flameColor = isCurrent ? 0xffcc44 : 0xcc7722;
      const pulse = Math.sin(this.animTimer + cp.x) * 3;

      // Soft amber ground glow
      this.graphics.fillStyle(flameColor, 0.15);
      this.graphics.fillCircle(cp.x, cp.y - 12, 28 + pulse);

      // Lantern housing
      this.graphics.fillStyle(0x1a1510, 1);
      this.graphics.fillRect(cp.x - 5, cp.y - 20, 10, 14);

      // Flame core
      this.graphics.fillStyle(flameColor, 0.95);
      this.graphics.fillCircle(cp.x, cp.y - 13, 3.5);

      if (isCurrent) {
        // Active respawn mark (golden halo)
        this.graphics.lineStyle(1.5, 0xffe277, 0.7);
        this.graphics.strokeCircle(cp.x, cp.y - 13, 8 + Math.sin(this.animTimer * 2) * 2);
      }

      // Checkpoint prompt position
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
    this.graphics.destroy();
    this.promptText.destroy();
  }
}
