import * as Phaser from 'phaser';
import { LanternStateSnapshot } from '../../domain/lantern/LanternTypes';
import { PlayerStateSnapshot } from '../../domain/player/PlayerTypes';

export class GameHud {
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private debugText: Phaser.GameObjects.Text;
  private notificationText: Phaser.GameObjects.Text;
  private leftLanternLabel: Phaser.GameObjects.Text;
  private rightLanternLabel: Phaser.GameObjects.Text;
  private notificationTimer = 0;
  private debugVisible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(110);

    this.graphics = this.scene.add.graphics();
    this.container.add(this.graphics);

    // Left Lantern Label
    this.leftLanternLabel = this.scene.add.text(20, 50, 'LEFT LANTERN [J / LMB]', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '10px',
      color: '#9aa8ba',
    });
    this.container.add(this.leftLanternLabel);

    // Right Lantern Label
    this.rightLanternLabel = this.scene.add.text(220, 50, 'RIGHT LANTERN [K / RMB]', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '10px',
      color: '#9aa8ba',
    });
    this.container.add(this.rightLanternLabel);

    // Notification toast banner
    this.notificationText = this.scene.add
      .text(viewportWidth / 2, 45, '', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '15px',
        color: '#ffea9f',
        backgroundColor: '#0a0a14dd',
        padding: { left: 14, right: 14, top: 6, bottom: 6 },
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.container.add(this.notificationText);

    // Debug text
    this.debugText = this.scene.add
      .text(14, viewportHeight - 110, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '11px',
        color: '#70e090',
        backgroundColor: '#000000bb',
        padding: { left: 6, right: 6, top: 4, bottom: 4 },
      })
      .setVisible(false);
    this.container.add(this.debugText);

    // Static controls hint at the bottom
    const controlsText = this.scene.add
      .text(
        viewportWidth / 2,
        viewportHeight - 14,
        'Move: [A][D]  |  Jump: [W]/[Space]  |  Light Beams: [J][K] or [LMB][RMB]  |  Rest: [E]  |  Debug: [F1]',
        {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '11px',
          color: '#8b9bb4',
        }
      )
      .setOrigin(0.5, 0.5);
    this.container.add(controlsText);
  }

  public showNotification(msg: string, durationSeconds = 3): void {
    this.notificationText.setText(msg).setVisible(true);
    this.notificationTimer = durationSeconds;
  }

  public toggleDebug(): void {
    this.debugVisible = !this.debugVisible;
    this.debugText.setVisible(this.debugVisible);
  }

  public isDebugVisible(): boolean {
    return this.debugVisible;
  }

  public update(
    dtSeconds: number,
    player: PlayerStateSnapshot,
    lanterns: readonly [LanternStateSnapshot, LanternStateSnapshot],
    enemyCount: number
  ): void {
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dtSeconds;
      if (this.notificationTimer <= 0) {
        this.notificationText.setVisible(false);
      }
    }

    this.graphics.clear();

    // 1. Lives (Stitched Hearts)
    this.drawLives(player.lives, player.maxLives);

    // 2. Dual Lantern Gauges
    this.drawLanternGauge(20, 52, lanterns[0], this.leftLanternLabel);
    this.drawLanternGauge(220, 52, lanterns[1], this.rightLanternLabel);

    // 3. Debug Overlay
    if (this.debugVisible) {
      this.debugText.setText(
        `[DEBUG MONITOR]\n` +
          `Player: Pos(${player.x.toFixed(1)}, ${player.y.toFixed(1)}) | Vel(${player.vx.toFixed(0)}, ${player.vy.toFixed(0)}) | Grounded: ${player.isGrounded}\n` +
          `Lantern L: Heat ${lanterns[0].heat.toFixed(1)}% | Angle ${lanterns[0].currentAngleDegrees.toFixed(0)}° | Status: ${lanterns[0].status} | Target: ${lanterns[0].activeTargetId ?? 'none'}\n` +
          `Lantern R: Heat ${lanterns[1].heat.toFixed(1)}% | Angle ${lanterns[1].currentAngleDegrees.toFixed(0)}° | Status: ${lanterns[1].status} | Target: ${lanterns[1].activeTargetId ?? 'none'}\n` +
          `Enemies Active: ${enemyCount}`
      );
    }
  }

  private drawLives(lives: number, maxLives: number): void {
    const startX = 20;
    const startY = 22;

    for (let i = 0; i < maxLives; i++) {
      const x = startX + i * 26;
      const y = startY;
      const hasLife = i < lives;

      if (hasLife) {
        // Full heart (stitched plush heart)
        this.graphics.fillStyle(0xd63e48, 1);
        this.graphics.fillCircle(x - 4, y - 3, 5);
        this.graphics.fillCircle(x + 4, y - 3, 5);
        this.graphics.fillTriangle(x - 9, y - 2, x + 9, y - 2, x, y + 8);

        // Stitch cross
        this.graphics.lineStyle(1, 0xffd2d6, 0.85);
        this.graphics.lineBetween(x - 2, y - 2, x + 2, y + 2);
        this.graphics.lineBetween(x - 2, y + 2, x + 2, y - 2);
      } else {
        // Lost / torn life slot
        this.graphics.fillStyle(0x281e22, 0.8);
        this.graphics.fillCircle(x - 4, y - 3, 5);
        this.graphics.fillCircle(x + 4, y - 3, 5);
        this.graphics.fillTriangle(x - 9, y - 2, x + 9, y - 2, x, y + 8);

        this.graphics.lineStyle(1, 0x5a3e46, 0.7);
        this.graphics.strokeCircle(x - 4, y - 3, 5);
        this.graphics.strokeCircle(x + 4, y - 3, 5);
      }
    }
  }

  private drawLanternGauge(
    x: number,
    y: number,
    lantern: LanternStateSnapshot,
    label: Phaser.GameObjects.Text
  ): void {
    const width = 170;
    const height = 12;

    // Background pill frame
    this.graphics.fillStyle(0x0e1118, 0.85);
    this.graphics.fillRoundedRect(x, y + 14, width, height, 4);
    this.graphics.lineStyle(1, 0x2d3a4e, 0.9);
    this.graphics.strokeRoundedRect(x, y + 14, width, height, 4);

    if (lantern.isDestroyed) {
      // Exploded state
      this.graphics.fillStyle(0x751b1b, 0.9);
      this.graphics.fillRoundedRect(x + 2, y + 16, width - 4, height - 4, 2);
      label.setText(label.text.split(' - ')[0] + ' - DESTROYED');
      label.setColor('#e04848');
      return;
    }

    label.setText(label.text.split(' - ')[0]);
    label.setColor('#9aa8ba');

    // Heat fill bar
    const ratio = Math.min(1, lantern.heat / lantern.maxHeat);
    const fillWidth = Math.max(0, (width - 4) * ratio);

    if (fillWidth > 0) {
      let heatColor = 0xffbf33; // Amber
      if (ratio > 0.8) {
        heatColor = 0xee2c2c; // Critical red
      } else if (ratio > 0.5) {
        heatColor = 0xff6b22; // Hot orange
      }

      this.graphics.fillStyle(heatColor, 1);
      this.graphics.fillRoundedRect(x + 2, y + 16, fillWidth, height - 4, 2);
    }

    // Sensing / locked indicator bulb
    const bulbX = x + width - 8;
    const bulbY = y + 7;
    if (lantern.hasTarget) {
      const bulbColor = lantern.isBeamActive ? 0xffffff : 0xffea55;
      this.graphics.fillStyle(bulbColor, 1);
      this.graphics.fillCircle(bulbX, bulbY, 4);
      this.graphics.lineStyle(1, 0xffbb22, 0.8);
      this.graphics.strokeCircle(bulbX, bulbY, 6);
    } else {
      this.graphics.fillStyle(0x283040, 0.8);
      this.graphics.fillCircle(bulbX, bulbY, 3);
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
