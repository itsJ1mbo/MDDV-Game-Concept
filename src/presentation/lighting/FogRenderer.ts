import * as Phaser from 'phaser';
import { FogTuning, LanternTuning } from '../../config/GameConfig';
import { LanternStateSnapshot } from '../../domain/lantern/LanternTypes';

export class FogRenderer {
  private renderTexture: Phaser.GameObjects.RenderTexture;
  private eraseGraphics: Phaser.GameObjects.Graphics;
  private beamGlowGraphics: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fogTuning: FogTuning,
    private readonly lanternTuning: LanternTuning,
    viewportWidth: number,
    viewportHeight: number
  ) {
    // 1. Fog render texture in screen space
    this.renderTexture = this.scene.add
      .renderTexture(0, 0, viewportWidth, viewportHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // 2. Offscreen graphics used for erasing shapes from the fog render texture
    this.eraseGraphics = this.scene.make.graphics({ x: 0, y: 0 }, false);

    // 3. World-space beam visuals drawn beneath the fog cutout
    this.beamGlowGraphics = this.scene.add.graphics().setDepth(50);
  }

  public resize(width: number, height: number): void {
    this.renderTexture.resize(width, height);
  }

  public update(
    playerWorldX: number,
    playerWorldY: number,
    lanterns: readonly [LanternStateSnapshot, LanternStateSnapshot]
  ): void {
    const cam = this.scene.cameras.main;

    // Convert player position to screen coordinates
    const screenPx = playerWorldX - cam.scrollX;
    const screenPy = playerWorldY - cam.scrollY;

    // 1. Clear and refill base fog of war
    this.renderTexture.clear();
    this.renderTexture.fill(this.fogTuning.fogColor, this.fogTuning.fogOpacity);

    // 2. Erase visibility shapes
    this.eraseGraphics.clear();
    this.eraseGraphics.fillStyle(0xffffff, 1.0);

    // Erase player tight personal circle
    this.eraseGraphics.fillCircle(
      screenPx,
      screenPy,
      this.fogTuning.playerVisibilityRadius
    );

    // Erase beam cones for active lanterns
    for (const lantern of lanterns) {
      if (lantern.isBeamActive && !lantern.isDestroyed) {
        this.drawAcuteSector(
          this.eraseGraphics,
          screenPx,
          screenPy,
          this.lanternTuning.maxBeamRange,
          lantern.currentAngleDegrees,
          this.lanternTuning.beamAngleDegrees
        );
      }
    }

    // Apply erasure to fog layer
    this.renderTexture.erase(this.eraseGraphics, 0, 0);

    // 3. Draw ambient & active light glow in world space
    this.beamGlowGraphics.clear();

    // Subtle warm halo around the teddy bear
    this.beamGlowGraphics.fillStyle(0xffe8ba, 0.12);
    this.beamGlowGraphics.fillCircle(
      playerWorldX,
      playerWorldY,
      this.fogTuning.playerVisibilityRadius * 0.95
    );

    this.beamGlowGraphics.fillStyle(0xfff5dd, 0.2);
    this.beamGlowGraphics.fillCircle(
      playerWorldX,
      playerWorldY,
      this.fogTuning.playerVisibilityRadius * 0.55
    );

    // Dramatic lighthouse beam glow
    for (const lantern of lanterns) {
      if (lantern.isBeamActive && !lantern.isDestroyed) {
        // Outer softer beam
        this.beamGlowGraphics.fillStyle(0xffea9f, 0.22);
        this.drawAcuteSector(
          this.beamGlowGraphics,
          playerWorldX,
          playerWorldY,
          this.lanternTuning.maxBeamRange,
          lantern.currentAngleDegrees,
          this.lanternTuning.beamAngleDegrees * 1.05
        );

        // Core searing beam
        this.beamGlowGraphics.fillStyle(0xffffff, 0.45);
        this.drawAcuteSector(
          this.beamGlowGraphics,
          playerWorldX,
          playerWorldY,
          this.lanternTuning.maxBeamRange * 0.92,
          lantern.currentAngleDegrees,
          this.lanternTuning.beamAngleDegrees * 0.65
        );

        // Center piercing laser ray
        this.beamGlowGraphics.lineStyle(2, 0xffffff, 0.8);
        const rad = Phaser.Math.DegToRad(lantern.currentAngleDegrees);
        const endX = playerWorldX + Math.cos(rad) * this.lanternTuning.maxBeamRange;
        const endY = playerWorldY + Math.sin(rad) * this.lanternTuning.maxBeamRange;
        this.beamGlowGraphics.lineBetween(playerWorldX, playerWorldY, endX, endY);
      }
    }
  }

  private drawAcuteSector(
    graphics: Phaser.GameObjects.Graphics,
    originX: number,
    originY: number,
    radius: number,
    centerAngleDeg: number,
    spreadDeg: number
  ): void {
    const halfSpread = spreadDeg / 2;
    const startAngleRad = Phaser.Math.DegToRad(centerAngleDeg - halfSpread);
    const endAngleRad = Phaser.Math.DegToRad(centerAngleDeg + halfSpread);

    graphics.beginPath();
    graphics.moveTo(originX, originY);
    graphics.arc(
      originX,
      originY,
      radius,
      startAngleRad,
      endAngleRad,
      false
    );
    graphics.closePath();
    graphics.fillPath();
  }

  public destroy(): void {
    this.renderTexture.destroy();
    this.eraseGraphics.destroy();
    this.beamGlowGraphics.destroy();
  }
}
