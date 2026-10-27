import { CheckpointDef, EnemySpawnPoint, LevelDefinition } from './LevelTypes';
import { PlatformBox } from '../player/PlayerTypes';

export interface TiledProperty {
  name: string;
  type?: string;
  value: string | number | boolean;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: TiledProperty[];
}

export interface TiledLayer {
  id: number;
  name: string;
  type: 'tilelayer' | 'objectgroup';
  objects?: TiledObject[];
  data?: number[];
  width?: number;
  height?: number;
}

export interface TiledMapJSON {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
}

export class TiledLevelLoader {
  /**
   * Parses Tiled JSON data into an authoritative, typed LevelDefinition domain object.
   */
  public static parse(
    map: TiledMapJSON,
    levelId = 'attic-escape',
    levelName = 'Chapter 1: The Dark Attic'
  ): LevelDefinition {
    let startX = 120;
    let startY = 380;
    const platforms: PlatformBox[] = [];
    const checkpoints: CheckpointDef[] = [];
    const enemySpawns: EnemySpawnPoint[] = [];
    let goalArea = { x: 3100, y: 150, width: 80, height: 120 };

    for (const layer of map.layers) {
      if (layer.type === 'objectgroup' && layer.objects) {
        for (const obj of layer.objects) {
          const type = (obj.type || '').toLowerCase();
          const name = obj.name || '';

          if (type === 'spawn' || name.toLowerCase().includes('spawn')) {
            startX = obj.x;
            startY = obj.y;
          } else if (type === 'platform' || layer.name === 'Collisions') {
            platforms.push({
              x: obj.x,
              y: obj.y,
              width: obj.width ?? 0,
              height: obj.height ?? 0,
            });
          } else if (type === 'checkpoint') {
            const idProp = this.getProperty<string>(obj, 'id') ?? name;
            const nameProp = this.getProperty<string>(obj, 'name') ?? name;
            checkpoints.push({
              id: idProp,
              name: nameProp,
              x: obj.x,
              y: obj.y,
            });
          } else if (type === 'enemy') {
            const idProp = this.getProperty<string>(obj, 'id') ?? name;
            const triggerDist = this.getProperty<number>(obj, 'triggerDistance') ?? 300;
            enemySpawns.push({
              id: idProp,
              x: obj.x,
              y: obj.y,
              triggerDistance: triggerDist,
            });
          } else if (type === 'goal' || name.toLowerCase().includes('goal')) {
            goalArea = {
              x: obj.x,
              y: obj.y,
              width: obj.width ?? 80,
              height: obj.height ?? 120,
            };
          }
        }
      }
    }

    return {
      id: levelId,
      name: levelName,
      startX,
      startY,
      platforms,
      checkpoints,
      enemySpawns,
      goalArea,
    };
  }

  private static getProperty<T extends string | number | boolean>(
    obj: TiledObject,
    propName: string
  ): T | undefined {
    if (!obj.properties) return undefined;
    const found = obj.properties.find((p) => p.name === propName);
    return found ? (found.value as T) : undefined;
  }
}
