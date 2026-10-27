import * as Phaser from 'phaser';
import { EnemyStateSnapshot } from '../../domain/enemy/EnemyTypes';

interface DisintegrationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
}

export class EnemyRenderer {
  private graphics: Phaser.GameObjects.Graphics;
  private particleGraphics: Phaser.GameObjects.Graphics;
  private particles: DisintegrationParticle[] = [];
  private animTimer = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.graphics = this.scene.add.graphics().setDepth(55);
    this.particleGraphics = this.scene.add.graphics().setDepth(58);
  }

  public update(dtSeconds: number, enemies: readonly EnemyStateSnapshot[]): void {
    this.animTimer += dtSeconds * 4;

    this.graphics.clear();
    this.particleGraphics.clear();

    // 1. Update and draw existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtSeconds;
      p.y += p.vy * dtSeconds;
      p.life -= dtSeconds;
      p.alpha = Math.max(0, p.life * 1.5);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.particleGraphics.fillStyle(0xffe288, p.alpha);
      this.particleGraphics.fillCircle(p.x, p.y, p.size);
    }

    // 2. Draw active shadow enemies
    for (const enemy of enemies) {
      if (enemy.isDestroyed) continue;

      this.drawEnemy(enemy);
    }
  }

  private drawEnemy(enemy: EnemyStateSnapshot): void {
    const isExposed = enemy.isFrozen;
    const exposure = enemy.exposureRatio;

    // Shake jitter when exposed to burning light
    let shakeX = 0;
    let shakeY = 0;
    if (isExposed) {
      shakeX = (Math.random() - 0.5) * 6 * (0.4 + exposure * 0.6);
      shakeY = (Math.random() - 0.5) * 6 * (0.4 + exposure * 0.6);
    }

    const ex = enemy.x + shakeX;
    const ey = enemy.y + shakeY;

    // Outer dark shadow aura
    this.graphics.fillStyle(0x06050a, 0.6);
    this.graphics.fillCircle(ex, ey, 18);

    // Shadow tendrils undulating
    const tendrilCount = 6;
    for (let i = 0; i < tendrilCount; i++) {
      const angle = (i * Math.PI * 2) / tendrilCount + this.animTimer * 0.8;
      const tendrilLen = 14 + Math.sin(this.animTimer * 2 + i) * 5;
      const tx = ex + Math.cos(angle) * tendrilLen;
      const ty = ey + Math.sin(angle) * tendrilLen;

      this.graphics.lineStyle(3, 0x110d18, 0.7);
      this.graphics.lineBetween(ex, ey, tx, ty);
    }

    // Core shadow body
    this.graphics.fillStyle(0x130e1c, 0.95);
    this.graphics.fillCircle(ex, ey, 12);

    // Glowing creepy eyes
    const eyeOffset = Math.sin(this.animTimer * 1.2) * 1.5;
    const eyeColor = isExposed ? 0xff4433 : 0xffeb88;
    this.graphics.fillStyle(eyeColor, 0.95);
    this.graphics.fillCircle(ex - 4 + eyeOffset, ey - 3, 2);
    this.graphics.fillCircle(ex + 4 + eyeOffset, ey - 3, 2);

    // Burning light exposure effect
    if (isExposed) {
      // Searing bright outline
      this.graphics.lineStyle(2 + exposure * 2, 0xffea88, 0.85);
      this.graphics.strokeCircle(ex, ey, 13 + exposure * 2);

      // Searing core glow
      this.graphics.fillStyle(0xffffff, exposure * 0.7);
      this.graphics.fillCircle(ex, ey, 9 * exposure);

      // Spawn burning embers
      if (Math.random() < 0.35) {
        this.particles.push({
          x: ex + (Math.random() - 0.5) * 16,
          y: ey + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 70,
          vy: -30 - Math.random() * 40,
          alpha: 1.0,
          size: 1.5 + Math.random() * 2,
          life: 0.3 + Math.random() * 0.3,
        });
      }
    }
  }

  public spawnDisintegrationBurst(x: number, y: number): void {
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        size: 2 + Math.random() * 3,
        life: 0.45 + Math.random() * 0.4,
      });
    }
  }

  public destroy(): void {
    this.graphics.destroy();
    this.particleGraphics.destroy();
    this.particles = [];
  }
}
