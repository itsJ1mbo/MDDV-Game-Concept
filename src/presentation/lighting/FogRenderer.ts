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
    // 1. Fog render texture in screen space:
    // Placed at depth 100 to completely blanket the game world (background, tiles, entities).
    // ScrollFactor 0 pins it to the screen viewport.
    this.renderTexture = this.scene.add
      .renderTexture(0, 0, viewportWidth, viewportHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // 2. Offscreen graphics used strictly for carving / erasing shapes from the fog render texture
    this.eraseGraphics = this.scene.make.graphics({ x: 0, y: 0 }, false);

    // 3. Secondary illumination pass: world-space subtle warm amber overlay beneath the fog cutout (depth 50).
    // Uses NORMAL blend mode with strictly clamped low alpha to warm the scene without washing out art.
    this.beamGlowGraphics = this.scene.add
      .graphics()
      .setDepth(50)
      .setBlendMode(Phaser.BlendModes.NORMAL);
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

    // Convert player position to screen coordinates accurately regardless of camera scroll
    const camX = cam.worldView?.width ? cam.worldView.x : cam.scrollX;
    const camY = cam.worldView?.height ? cam.worldView.y : cam.scrollY;
    const revealScale = cam.zoom || 1;
    const screenPx = (playerWorldX - camX) * revealScale;
    const screenPy = (playerWorldY - camY) * revealScale;

    // 1. Fog of War Mask: Clear and refill base fog layer with absolute pitch black (#000000 at 100% opacity)
    this.renderTexture.clear();
    this.renderTexture.fill(this.fogTuning.fogColor, this.fogTuning.fogOpacity);

    // 2. Erase visibility shapes using destination-out (BlendModes.ERASE)
    // Light sources function primarily as a mask reveal for the Fog of War layer.
    // Carving holes reveals the underlying hand-crafted artwork in its native contrast and vibrant colors.
    this.eraseGraphics.clear();

    const playerRadius = this.fogTuning.playerVisibilityRadius * revealScale;
    const edgeSoftness = Math.min(this.fogTuning.edgeSoftness * revealScale, playerRadius * 0.35);
    const coreRadius = Math.max(1, playerRadius - edgeSoftness);

    // Soft outer falloff for the player's personal light radius
    if (edgeSoftness > 0) {
      this.eraseGraphics.fillStyle(0xffffff, 0.25);
      this.eraseGraphics.fillCircle(screenPx, screenPy, playerRadius);

      this.eraseGraphics.fillStyle(0xffffff, 0.65);
      this.eraseGraphics.fillCircle(screenPx, screenPy, coreRadius + edgeSoftness * 0.5);
    }

    // Fully revealed central core (100% mask cutout)
    this.eraseGraphics.fillStyle(0xffffff, 1.0);
    this.eraseGraphics.fillCircle(screenPx, screenPy, coreRadius);

    // Erase beam cones for active, non-destroyed lanterns
    for (const lantern of lanterns) {
      if (lantern.isBeamActive && !lantern.isDestroyed) {
        const beamRange = this.lanternTuning.maxBeamRange * revealScale;
        const beamAngle = lantern.currentAngleDegrees;
        const beamSpread = this.lanternTuning.beamAngleDegrees;
        const beamSoftness = Math.min(this.fogTuning.edgeSoftness * revealScale, beamRange * 0.15);
        const coreRange = Math.max(1, beamRange - beamSoftness);
        const coreSpread = Math.max(1, beamSpread - 4);

        // Soft outer angular and distance falloff
        if (beamSoftness > 0) {
          this.eraseGraphics.fillStyle(0xffffff, 0.35);
          this.drawAcuteSector(
            this.eraseGraphics,
            screenPx,
            screenPy,
            beamRange,
            beamAngle,
            beamSpread
          );
        }

        // Fully cleared primary beam cone (100% mask cutout)
        this.eraseGraphics.fillStyle(0xffffff, 1.0);
        this.drawAcuteSector(
          this.eraseGraphics,
          screenPx,
          screenPy,
          coreRange,
          beamAngle,
          coreSpread
        );
      }
    }

    // Apply erasure to fog layer:
    // Areas covered by eraseGraphics are cleared to reveal the world;
    // Areas outside remain absolute opaque black (#000000).
    this.renderTexture.erase(this.eraseGraphics, 0, 0);

    // 3. Secondary Atmospheric Illumination Pass (World Space - Depth 50)
    // Strictly warm amber tones with low clamped alpha;
    // Decoupled from visibility masking so it never blows out color levels or drives RGB toward white.
    this.beamGlowGraphics.clear();

    // Subtle warm amber aura around the teddy bear
    if (this.fogTuning.lanternHaloIntensity > 0) {
      this.beamGlowGraphics.fillStyle(
        this.fogTuning.lanternHaloColor,
        this.fogTuning.lanternHaloIntensity
      );
      this.beamGlowGraphics.fillCircle(
        playerWorldX,
        playerWorldY,
        this.fogTuning.playerVisibilityRadius * 0.75
      );
    }

    // Warm directional illumination for active lantern beams
    for (const lantern of lanterns) {
      if (lantern.isBeamActive && !lantern.isDestroyed) {
        if (this.fogTuning.lanternBeamIntensity > 0) {
          // Soft outer atmospheric cone (half intensity)
          this.beamGlowGraphics.fillStyle(
            this.fogTuning.lanternBeamColor,
            this.fogTuning.lanternBeamIntensity * 0.5
          );
          this.drawAcuteSector(
            this.beamGlowGraphics,
            playerWorldX,
            playerWorldY,
            this.lanternTuning.maxBeamRange,
            lantern.currentAngleDegrees,
            this.lanternTuning.beamAngleDegrees
          );

          // Focused warm amber core (full clamped intensity, warm amber only - no pure white)
          this.beamGlowGraphics.fillStyle(
            this.fogTuning.lanternBeamColor,
            this.fogTuning.lanternBeamIntensity
          );
          this.drawAcuteSector(
            this.beamGlowGraphics,
            playerWorldX,
            playerWorldY,
            this.lanternTuning.maxBeamRange * 0.82,
            lantern.currentAngleDegrees,
            this.lanternTuning.beamAngleDegrees * 0.72
          );

          // Subtle warm filament guide (warm golden amber, clamped low alpha, width 1px - no white laser ray)
          this.beamGlowGraphics.lineStyle(1, this.fogTuning.lanternBeamColor, 0.15);
          const rad = Phaser.Math.DegToRad(lantern.currentAngleDegrees);
          const endX = playerWorldX + Math.cos(rad) * (this.lanternTuning.maxBeamRange * 0.85);
          const endY = playerWorldY + Math.sin(rad) * (this.lanternTuning.maxBeamRange * 0.85);
          this.beamGlowGraphics.lineBetween(playerWorldX, playerWorldY, endX, endY);
        }
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
