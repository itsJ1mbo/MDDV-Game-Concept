import * as Phaser from 'phaser';
import { LanternStateSnapshot } from '../../domain/lantern/LanternTypes';
import { PlayerStateSnapshot } from '../../domain/player/PlayerTypes';
import { ASSET_KEYS } from '../../infrastructure/assets/AssetKeys';

export class GameHud {
  private container: Phaser.GameObjects.Container;
  private debugText: Phaser.GameObjects.Text;
  private notificationText: Phaser.GameObjects.Text;
  private leftLanternLabel: Phaser.GameObjects.Text;
  private rightLanternLabel: Phaser.GameObjects.Text;
  private notificationTimer = 0;
  private debugVisible = false;

  // Vector SVG UI Elements
  private heartImages: Phaser.GameObjects.Image[] = [];
  private leftGaugeFrame: Phaser.GameObjects.Image;
  private leftGaugeFill: Phaser.GameObjects.Image;
  private leftBulb: Phaser.GameObjects.Image;

  private rightGaugeFrame: Phaser.GameObjects.Image;
  private rightGaugeFill: Phaser.GameObjects.Image;
  private rightBulb: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(110);

    // 1. Stitched Heart Life Slots (SVG Images)
    const maxLives = 3;
    for (let i = 0; i < maxLives; i++) {
      const heartImg = this.scene.add
        .image(30 + i * 28, 26, ASSET_KEYS.HEART_FULL)
        .setOrigin(0.5, 0.5);
      this.heartImages.push(heartImg);
      this.container.add(heartImg);
    }

    // 2. Left Lantern Gauge
    this.leftLanternLabel = this.scene.add.text(20, 50, 'LEFT LANTERN [J / LMB]', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '10px',
      color: '#9aa8ba',
    });
    this.container.add(this.leftLanternLabel);

    this.leftGaugeFrame = this.scene.add
      .image(20, 66, ASSET_KEYS.GAUGE_FRAME)
      .setOrigin(0, 0);
    this.leftGaugeFill = this.scene.add
      .image(22, 68, ASSET_KEYS.GAUGE_FILL)
      .setOrigin(0, 0);
    this.leftBulb = this.scene.add
      .image(180, 56, ASSET_KEYS.BULB_INACTIVE)
      .setOrigin(0.5, 0.5);

    this.container.add([this.leftGaugeFrame, this.leftGaugeFill, this.leftBulb]);

    // 3. Right Lantern Gauge
    this.rightLanternLabel = this.scene.add.text(220, 50, 'RIGHT LANTERN [K / RMB]', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '10px',
      color: '#9aa8ba',
    });
    this.container.add(this.rightLanternLabel);

    this.rightGaugeFrame = this.scene.add
      .image(220, 66, ASSET_KEYS.GAUGE_FRAME)
      .setOrigin(0, 0);
    this.rightGaugeFill = this.scene.add
      .image(222, 68, ASSET_KEYS.GAUGE_FILL)
      .setOrigin(0, 0);
    this.rightBulb = this.scene.add
      .image(380, 56, ASSET_KEYS.BULB_INACTIVE)
      .setOrigin(0.5, 0.5);

    this.container.add([this.rightGaugeFrame, this.rightGaugeFill, this.rightBulb]);

    // 4. Notification Toast Banner
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

    // 5. Debug Text
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

    // 6. Static Controls Hint at bottom
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

    // 1. Update Stitched Hearts
    for (let i = 0; i < this.heartImages.length; i++) {
      const hasLife = i < player.lives;
      const targetTex = hasLife ? ASSET_KEYS.HEART_FULL : ASSET_KEYS.HEART_EMPTY;
      if (this.heartImages[i].texture.key !== targetTex) {
        this.heartImages[i].setTexture(targetTex);
      }
    }

    // 2. Update Left Lantern Gauge
    this.updateGauge(
      lanterns[0],
      this.leftLanternLabel,
      this.leftGaugeFill,
      this.leftBulb
    );

    // 3. Update Right Lantern Gauge
    this.updateGauge(
      lanterns[1],
      this.rightLanternLabel,
      this.rightGaugeFill,
      this.rightBulb
    );

    // 4. Debug Overlay
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

  private updateGauge(
    lantern: LanternStateSnapshot,
    label: Phaser.GameObjects.Text,
    fillImg: Phaser.GameObjects.Image,
    bulbImg: Phaser.GameObjects.Image
  ): void {
    const maxWidth = 166;

    if (lantern.isDestroyed) {
      fillImg.setVisible(false);
      label.setText(label.text.split(' - ')[0] + ' - DESTROYED');
      label.setColor('#e04848');
      bulbImg.setTexture(ASSET_KEYS.BULB_INACTIVE);
      return;
    }

    label.setText(label.text.split(' - ')[0]);
    label.setColor('#9aa8ba');

    const ratio = Math.max(0, Math.min(1, lantern.heat / lantern.maxHeat));
    if (ratio > 0.01) {
      fillImg.setVisible(true);
      fillImg.setDisplaySize(maxWidth * ratio, 12);
    } else {
      fillImg.setVisible(false);
    }

    // Sensor Indicator Bulb
    const targetBulb = lantern.hasTarget
      ? ASSET_KEYS.BULB_ACTIVE
      : ASSET_KEYS.BULB_INACTIVE;
    if (bulbImg.texture.key !== targetBulb) {
      bulbImg.setTexture(targetBulb);
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
