import * as Phaser from 'phaser';
import { LanternStateSnapshot } from '../../domain/lantern/LanternTypes';
import { PlayerStateSnapshot } from '../../domain/player/PlayerTypes';
import { ASSET_KEYS } from '../../infrastructure/assets/AssetKeys';

export class PlayerRenderer {
  private container: Phaser.GameObjects.Container;
  private bearSprite: Phaser.GameObjects.Sprite;
  private lanternLeftSprite: Phaser.GameObjects.Sprite;
  private lanternRightSprite: Phaser.GameObjects.Sprite;
  private animTimer = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = this.scene.add.container(0, 0).setDepth(60);

    // Vector SVG Bear Sprite
    this.bearSprite = this.scene.add
      .sprite(0, 0, ASSET_KEYS.PLAYER_BEAR)
      .setOrigin(0.5, 0.5);

    // Dual Vector SVG Lantern Sprites
    this.lanternLeftSprite = this.scene.add
      .sprite(-14, -6, ASSET_KEYS.LANTERN_IDLE)
      .setOrigin(0.5, 0.5);

    this.lanternRightSprite = this.scene.add
      .sprite(14, -6, ASSET_KEYS.LANTERN_IDLE)
      .setOrigin(0.5, 0.5);

    this.container.add([
      this.bearSprite,
      this.lanternLeftSprite,
      this.lanternRightSprite,
    ]);
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

    const facingLeft = player.facingDirection === 'left';
    this.bearSprite.setFlipX(facingLeft);

    // Walking bob
    const bob =
      player.isGrounded && Math.abs(player.vx) > 10
        ? Math.sin(this.animTimer) * 2
        : 0;
    this.bearSprite.setY(bob);

    // Update Left Lantern
    this.updateLanternSprite(
      this.lanternLeftSprite,
      lanterns[0],
      bob
    );

    // Update Right Lantern
    this.updateLanternSprite(
      this.lanternRightSprite,
      lanterns[1],
      bob
    );
  }

  private updateLanternSprite(
    sprite: Phaser.GameObjects.Sprite,
    lantern: LanternStateSnapshot,
    bob: number
  ): void {
    // Select SVG texture based on lantern state
    let targetTexture: string = ASSET_KEYS.LANTERN_IDLE;
    if (lantern.isDestroyed) {
      targetTexture = ASSET_KEYS.LANTERN_DESTROYED;
    } else if (lantern.isBeamActive) {
      targetTexture = ASSET_KEYS.LANTERN_ACTIVE;
    }

    if (sprite.texture.key !== targetTexture) {
      sprite.setTexture(targetTexture);
    }

    if (lantern.isDestroyed) {
      sprite.clearTint();
    } else {
      sprite.setTint(this.getHeatTint(lantern.heat / lantern.maxHeat));
    }

    // Calculate swivel angle
    const orbitRad = Phaser.Math.DegToRad(lantern.orbitAngleDegrees);
    const lx = Math.cos(orbitRad) * lantern.orbitRadius;
    const ly = Math.sin(orbitRad) * lantern.orbitRadius + bob;
    sprite.setPosition(lx, ly);

    // Rotate lantern towards target
    if (lantern.hasTarget && !lantern.isDestroyed) {
      sprite.setRotation(
        Phaser.Math.DegToRad(lantern.currentAngleDegrees) - Math.PI / 2
      );
    } else {
      sprite.setRotation(0);
    }
  }

  private getHeatTint(heatRatio: number): number {
    const ratio = Math.max(0, Math.min(1, heatRatio));
    const green = Math.round(255 * (1 - ratio));
    const blue = Math.round(255 * (1 - ratio));
    return (255 << 16) | (green << 8) | blue;
  }

  public getFollowTarget(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
