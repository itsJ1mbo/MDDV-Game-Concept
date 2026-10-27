import * as Phaser from 'phaser';
import { EnemyStateSnapshot } from '../../domain/enemy/EnemyTypes';
import { ASSET_KEYS } from '../../infrastructure/assets/AssetKeys';

interface EmberParticle {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class EnemyRenderer {
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private particles: EmberParticle[] = [];
  private animTimer = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  public update(dtSeconds: number, enemies: readonly EnemyStateSnapshot[]): void {
    this.animTimer += dtSeconds * 4;

    // 1. Update Disintegration Ember Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.sprite.x += p.vx * dtSeconds;
      p.sprite.y += p.vy * dtSeconds;
      p.life -= dtSeconds;
      p.sprite.setAlpha(Math.max(0, p.life / p.maxLife));

      if (p.life <= 0) {
        p.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }

    // 2. Render and Sync Enemy Sprites
    const activeEnemyIds = new Set<string>();

    for (const enemy of enemies) {
      if (enemy.isDestroyed) {
        // Destroy sprite if enemy has perished
        const existing = this.enemySprites.get(enemy.id);
        if (existing) {
          existing.destroy();
          this.enemySprites.delete(enemy.id);
        }
        continue;
      }

      activeEnemyIds.add(enemy.id);
      let sprite = this.enemySprites.get(enemy.id);

      if (!sprite) {
        sprite = this.scene.add
          .sprite(enemy.x, enemy.y, ASSET_KEYS.SHADOW_STALKER)
          .setDepth(55)
          .setOrigin(0.5, 0.5);
        this.enemySprites.set(enemy.id, sprite);
      }

      // Jitter when exposed to burning light
      let shakeX = 0;
      let shakeY = 0;
      if (enemy.isFrozen) {
        const shakeIntensity = 4 * (0.4 + enemy.exposureRatio * 0.6);
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
      }

      sprite.setPosition(enemy.x + shakeX, enemy.y + shakeY);

      // Subtle breathing scale
      const pulse = 1 + Math.sin(this.animTimer + enemy.x) * 0.05;
      sprite.setScale(pulse, pulse);

      // Texture swap: normal stalker vs light-exposed burning stalker
      const targetTexture = enemy.isFrozen
        ? ASSET_KEYS.SHADOW_STALKER_EXPOSED
        : ASSET_KEYS.SHADOW_STALKER;

      if (sprite.texture.key !== targetTexture) {
        sprite.setTexture(targetTexture);
      }

      // Spawn burning embers while exposed
      if (enemy.isFrozen && Math.random() < 0.3) {
        this.spawnSingleEmber(
          enemy.x + (Math.random() - 0.5) * 16,
          enemy.y + (Math.random() - 0.5) * 16
        );
      }
    }

    // Cleanup any sprites for enemies no longer in the snapshot
    for (const [id, sprite] of this.enemySprites.entries()) {
      if (!activeEnemyIds.has(id)) {
        sprite.destroy();
        this.enemySprites.delete(id);
      }
    }
  }

  private spawnSingleEmber(x: number, y: number): void {
    const pSprite = this.scene.add
      .sprite(x, y, ASSET_KEYS.PARTICLE_EMBER)
      .setDepth(58)
      .setOrigin(0.5, 0.5);

    const life = 0.3 + Math.random() * 0.3;
    this.particles.push({
      sprite: pSprite,
      vx: (Math.random() - 0.5) * 60,
      vy: -30 - Math.random() * 40,
      life,
      maxLife: life,
    });
  }

  public spawnDisintegrationBurst(x: number, y: number): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      const life = 0.4 + Math.random() * 0.4;

      const pSprite = this.scene.add
        .sprite(x, y, ASSET_KEYS.PARTICLE_EMBER)
        .setDepth(58)
        .setOrigin(0.5, 0.5)
        .setScale(1 + Math.random() * 0.6);

      this.particles.push({
        sprite: pSprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
      });
    }
  }

  public destroy(): void {
    for (const sprite of this.enemySprites.values()) {
      sprite.destroy();
    }
    this.enemySprites.clear();

    for (const p of this.particles) {
      p.sprite.destroy();
    }
    this.particles = [];
  }
}
