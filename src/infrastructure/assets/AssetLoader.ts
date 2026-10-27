import * as Phaser from 'phaser';
import { SVG_ASSETS, TILEMAP_ASSETS } from './AssetKeys';

export class AssetLoader {
  /**
   * Preloads all vector SVG assets and Tiled tilemaps into the Phaser cache.
   */
  public static preloadAll(scene: Phaser.Scene): void {
    // 1. Preload SVG vector images with target dimensions
    for (const svg of SVG_ASSETS) {
      if (svg.width && svg.height) {
        scene.load.svg(svg.key, svg.path, {
          width: svg.width,
          height: svg.height,
        });
      } else {
        scene.load.svg(svg.key, svg.path);
      }
    }

    // 2. Preload Tiled tilemaps
    for (const map of TILEMAP_ASSETS) {
      scene.load.tilemapTiledJSON(map.key, map.path);
    }

    // Error logging to ensure missing files are immediately reported
    scene.load.on('loaderror', (fileObj: Phaser.Loader.File) => {
      console.error(
        `[AssetLoader] Failed to load asset key "${fileObj.key}" from "${fileObj.src}"`
      );
    });
  }
}
