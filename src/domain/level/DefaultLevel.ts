import { LevelDefinition } from './LevelTypes';

export const LEVEL_1: LevelDefinition = {
  id: 'attic-escape',
  name: 'Chapter 1: The Dark Attic',
  startX: 120,
  startY: 380,
  platforms: [
    // Starting floor (solid wood attic floor)
    { x: 50, y: 440, width: 450, height: 40 },

    // First obstacle & gap over abyss
    { x: 560, y: 400, width: 140, height: 30 },
    { x: 760, y: 350, width: 160, height: 30 },

    // Checkpoint 2 platform (Sewing Table)
    { x: 990, y: 350, width: 380, height: 30 },

    // Middle high shelves & drops
    { x: 1440, y: 310, width: 140, height: 30 },
    { x: 1640, y: 260, width: 130, height: 30 },
    { x: 1840, y: 320, width: 180, height: 30 },

    // Checkpoint 3 platform (Toy Chest Haven)
    { x: 2090, y: 380, width: 360, height: 30 },

    // Final ascent towards the sunlit bedroom door
    { x: 2520, y: 340, width: 140, height: 30 },
    { x: 2720, y: 290, width: 150, height: 30 },
    { x: 2930, y: 240, width: 280, height: 40 },
  ],
  checkpoints: [
    {
      id: 'cp-attic-start',
      name: 'Old Armchair',
      x: 140,
      y: 410,
    },
    {
      id: 'cp-sewing-table',
      name: 'Sewing Table Bench',
      x: 1080,
      y: 320,
    },
    {
      id: 'cp-toy-chest',
      name: 'Carved Toy Chest',
      x: 2180,
      y: 350,
    },
  ],
  enemySpawns: [
    // First stalker creeping from the dark
    { id: 'shadow-stalker-1', x: 420, y: 410, triggerDistance: 320 },
    // Second stalker near the chasm
    { id: 'shadow-stalker-2', x: 860, y: 320, triggerDistance: 300 },
    // Ambushes on the high shelves
    { id: 'shadow-stalker-3', x: 1380, y: 280, triggerDistance: 280 },
    { id: 'shadow-stalker-4', x: 1720, y: 230, triggerDistance: 280 },
    // Final gauntlet before the door
    { id: 'shadow-stalker-5', x: 2480, y: 310, triggerDistance: 300 },
    { id: 'shadow-stalker-6', x: 2820, y: 260, triggerDistance: 320 },
  ],
  goalArea: {
    x: 3100,
    y: 150,
    width: 80,
    height: 120,
  },
};
