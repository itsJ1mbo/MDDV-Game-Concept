import { CheckpointStateSnapshot } from './CheckpointTypes';

export class CheckpointModel {
  private activated = false;
  private currentRespawn = false;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly x: number,
    public readonly y: number
  ) {}

  public distanceTo(targetX: number, targetY: number): number {
    return Math.hypot(this.x - targetX, this.y - targetY);
  }

  public isPlayerInRange(
    playerX: number,
    playerY: number,
    interactionRadius: number
  ): boolean {
    return this.distanceTo(playerX, playerY) <= interactionRadius;
  }

  public activate(): void {
    this.activated = true;
  }

  public setCurrentRespawn(isCurrent: boolean): void {
    this.currentRespawn = isCurrent;
    if (isCurrent) {
      this.activated = true;
    }
  }

  public isActivated(): boolean {
    return this.activated;
  }

  public isCurrent(): boolean {
    return this.currentRespawn;
  }

  public getState(): CheckpointStateSnapshot {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      isActivated: this.activated,
      isCurrentRespawn: this.currentRespawn,
    };
  }
}
