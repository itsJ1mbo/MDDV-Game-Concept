import * as Phaser from 'phaser';
import { LanternStateSnapshot } from '../../domain/lantern/LanternTypes';
import { PlayerStateSnapshot } from '../../domain/player/PlayerTypes';

export class PlayerRenderer {
  private container: Phaser.GameObjects.Container;
  private bearBody: Phaser.GameObjects.Graphics;
  private lanternLeftGfx: Phaser.GameObjects.Graphics;
  private lanternRightGfx: Phaser.GameObjects.Graphics;
  private animTimer = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = this.scene.add.container(0, 0).setDepth(60);

    this.bearBody = this.scene.add.graphics();
    this.lanternLeftGfx = this.scene.add.graphics();
    this.lanternRightGfx = this.scene.add.graphics();

    this.container.add([this.bearBody, this.lanternLeftGfx, this.lanternRightGfx]);
  }

  public update(
    dtSeconds: number,
    player: PlayerStateSnapshot,
    lanterns: readonly [LanternStateSnapshot, LanternStateSnapshot]
  ): void {
    this.animTimer += dtSeconds * 5;
    this.container.setPosition(player.x, player.y);

    // Stagger / Invulnerability flicker
    if (player.isStaggered) {
      this.container.setAlpha(Math.sin(this.animTimer * 10) > 0 ? 0.35 : 0.95);
    } else {
      this.container.setAlpha(1.0);
    }

    // Direction flip
    this.container.setScale(player.facingDirection === 'left' ? -1 : 1, 1);

    // Draw Bear Sprite procedurally with rich plushie aesthetics
    this.drawBear(player);

    // Draw Dual Lanterns
    this.drawLantern(this.lanternLeftGfx, -14, -6, lanterns[0], player);
    this.drawLantern(this.lanternRightGfx, 14, -6, lanterns[1], player);
  }

  private drawBear(player: PlayerStateSnapshot): void {
    this.bearBody.clear();

    const bob = player.isGrounded && Math.abs(player.vx) > 10 ? Math.sin(this.animTimer) * 2 : 0;
    const bodyY = bob;

    // 1. Bear Ears
    // Left ear
    this.bearBody.fillStyle(0x7a4c28, 1);
    this.bearBody.fillCircle(-9, -20 + bodyY, 6);
    this.bearBody.fillStyle(0xba8a65, 1);
    this.bearBody.fillCircle(-9, -20 + bodyY, 3);

    // Right ear
    this.bearBody.fillStyle(0x7a4c28, 1);
    this.bearBody.fillCircle(9, -20 + bodyY, 6);
    this.bearBody.fillStyle(0xba8a65, 1);
    this.bearBody.fillCircle(9, -20 + bodyY, 3);

    // 2. Head
    this.bearBody.fillStyle(0x8a5832, 1);
    this.bearBody.fillCircle(0, -10 + bodyY, 13);

    // Snout
    this.bearBody.fillStyle(0xc49a78, 1);
    this.bearBody.fillEllipse(0, -7 + bodyY, 12, 9);

    // Black plush nose
    this.bearBody.fillStyle(0x221710, 1);
    this.bearBody.fillTriangle(-3, -10 + bodyY, 3, -10 + bodyY, 0, -7 + bodyY);

    // Button eye (right)
    this.bearBody.fillStyle(0x181512, 1);
    this.bearBody.fillCircle(4, -12 + bodyY, 2.5);
    // Button stitch highlight
    this.bearBody.lineStyle(1, 0xffffff, 0.6);
    this.bearBody.lineBetween(3, -12 + bodyY, 5, -12 + bodyY);

    // Cross-stitch eye (left)
    this.bearBody.lineStyle(1.5, 0x221710, 1);
    this.bearBody.lineBetween(-6, -14 + bodyY, -3, -11 + bodyY);
    this.bearBody.lineBetween(-6, -11 + bodyY, -3, -14 + bodyY);

    // 3. Body
    this.bearBody.fillStyle(0x7a4c28, 1);
    this.bearBody.fillRoundedRect(-11, 0 + bodyY, 22, 22, 6);

    // Belly patch
    this.bearBody.fillStyle(0xb5845c, 1);
    this.bearBody.fillCircle(0, 10 + bodyY, 7);

    // Patch cross-stitches
    this.bearBody.lineStyle(1, 0x4a2c14, 0.8);
    this.bearBody.lineBetween(-4, 8 + bodyY, -2, 10 + bodyY);
    this.bearBody.lineBetween(2, 9 + bodyY, 4, 11 + bodyY);

    // 4. Little Paws / Feet
    this.bearBody.fillStyle(0x603a1d, 1);
    this.bearBody.fillCircle(-6, 20 + bodyY, 4.5);
    this.bearBody.fillCircle(6, 20 + bodyY, 4.5);
  }

  private drawLantern(
    gfx: Phaser.GameObjects.Graphics,
    mountX: number,
    mountY: number,
    lantern: LanternStateSnapshot,
    player: PlayerStateSnapshot
  ): void {
    gfx.clear();

    // Swivel direction calculation
    // Account for container horizontal flip when facing left
    let angleDeg = lantern.currentAngleDegrees;
    if (player.facingDirection === 'left') {
      angleDeg = (180 - angleDeg + 360) % 360;
    }
    const angleRad = Phaser.Math.DegToRad(angleDeg);

    // Bracket / mount chain
    gfx.lineStyle(2, 0x4a3a2a, 1);
    gfx.lineBetween(mountX * 0.5, mountY, mountX, mountY);

    // Lantern body center position along swivel
    const swivelDist = 3;
    const lx = mountX + Math.cos(angleRad) * swivelDist;
    const ly = mountY + Math.sin(angleRad) * swivelDist;

    if (lantern.isDestroyed) {
      // Exploded / shattered lantern
      gfx.fillStyle(0x1f1915, 1);
      gfx.fillRect(lx - 4, ly - 5, 8, 10);
      gfx.lineStyle(1, 0x6e2b20, 0.9);
      // Shattered glass lines
      gfx.lineBetween(lx - 3, ly - 4, lx + 2, ly + 4);
      gfx.lineBetween(lx + 3, ly - 3, lx - 2, ly + 3);
      return;
    }

    // Brass top cap & bottom base
    gfx.fillStyle(0x947238, 1);
    gfx.fillRect(lx - 4, ly - 6, 8, 2.5);
    gfx.fillRect(lx - 4, ly + 4, 8, 2.5);

    // Glass bulb glow color
    let glowColor = 0xffe277;
    if (lantern.isBeamActive) {
      glowColor = 0xffffff;
    } else if (lantern.hasTarget) {
      // Glow shifts warm amber to hot orange-red as heat or proximity increases
      glowColor = lantern.heat > 50 ? 0xff7b22 : 0xffbc36;
    }

    // Glowing core
    const coreAlpha = Math.min(1.0, 0.4 + lantern.intensity * 0.6);
    gfx.fillStyle(glowColor, coreAlpha);
    gfx.fillCircle(lx, ly, 3.5);

    // Outer glow halo
    if (lantern.intensity > 0.3) {
      const haloAlpha = lantern.isBeamActive ? 0.65 : lantern.intensity * 0.4;
      gfx.fillStyle(glowColor, haloAlpha);
      gfx.fillCircle(lx, ly, 6 + lantern.intensity * 4);
    }

    // Directional lantern pointer cone indicator (subtle diegetic radar flare)
    if (lantern.hasTarget && !lantern.isBeamActive) {
      const flareLen = 8 + lantern.intensity * 10;
      const flareSpread = 0.3;
      gfx.fillStyle(glowColor, 0.35 * lantern.intensity);
      gfx.beginPath();
      gfx.moveTo(lx, ly);
      gfx.lineTo(
        lx + Math.cos(angleRad - flareSpread) * flareLen,
        ly + Math.sin(angleRad - flareSpread) * flareLen
      );
      gfx.lineTo(
        lx + Math.cos(angleRad + flareSpread) * flareLen,
        ly + Math.sin(angleRad + flareSpread) * flareLen
      );
      gfx.closePath();
      gfx.fillPath();
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
