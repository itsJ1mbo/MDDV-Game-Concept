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

    // Direction flip
    const facingLeft = player.facingDirection === 'left';
    this.container.setScale(facingLeft ? -1 : 1, 1);

    // Walking bob
    const bob =
      player.isGrounded && Math.abs(player.vx) > 10
        ? Math.sin(this.animTimer) * 2
        : 0;
    this.bearSprite.setY(bob);

    // Update Left Lantern
    this.updateLanternSprite(
      this.lanternLeftSprite,
      -14,
      -6 + bob,
      lanterns[0],
      facingLeft
    );

    // Update Right Lantern
    this.updateLanternSprite(
      this.lanternRightSprite,
      14,
      -6 + bob,
      lanterns[1],
      facingLeft
    );
  }

  private updateLanternSprite(
    sprite: Phaser.GameObjects.Sprite,
    mountX: number,
    mountY: number,
    lantern: LanternStateSnapshot,
    facingLeft: boolean
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

    // Calculate swivel angle
    let angleDeg = lantern.currentAngleDegrees;
    if (facingLeft) {
      angleDeg = (180 - angleDeg + 360) % 360;
    }
    const angleRad = Phaser.Math.DegToRad(angleDeg);

    // Subtle swivel offset from bracket
    const swivelDist = 3;
    const lx = mountX + Math.cos(angleRad) * swivelDist;
    const ly = mountY + Math.sin(angleRad) * swivelDist;
    sprite.setPosition(lx, ly);

    // Rotate lantern towards target
    if (lantern.hasTarget && !lantern.isDestroyed) {
      sprite.setRotation(angleRad - Math.PI / 2);
    } else {
      sprite.setRotation(0);
    }
  }

  public destroy(): void {
    this.container.destroy();
  }
}
