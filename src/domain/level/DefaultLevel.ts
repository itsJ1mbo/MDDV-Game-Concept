import level01Json from '../../../asset/maps/level_01.json';
import { LevelDefinition } from './LevelTypes';
import { TiledLevelLoader, TiledMapJSON } from './TiledLevelLoader';

export const LEVEL_1: LevelDefinition = TiledLevelLoader.parse(
  level01Json as unknown as TiledMapJSON,
  'attic-escape',
  'Chapter 1: The Dark Attic'
);
