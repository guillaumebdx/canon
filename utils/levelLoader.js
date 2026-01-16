import { Dimensions } from 'react-native';
import levelsData from '../data/levels.json';
import { BRICK_DEFAULTS } from '../config/gameConfig';

const { width, height } = Dimensions.get('window');

const createBrickRow = (rowConfig) => {
  const y = rowConfig.y * height;
  const count = rowConfig.count;
  const health = rowConfig.health || 2;
  
  const brickWidth = BRICK_DEFAULTS.width;
  const brickHeight = BRICK_DEFAULTS.height;
  const gap = BRICK_DEFAULTS.gap;
  
  let startX;
  if (rowConfig.x !== undefined) {
    startX = rowConfig.x * width;
  } else {
    const totalWidth = count * brickWidth + (count - 1) * gap;
    startX = (width - totalWidth) / 2 + brickWidth / 2;
  }
  
  const bricks = [];
  for (let i = 0; i < count; i++) {
    bricks.push({
      x: startX + i * (brickWidth + gap),
      y: y,
      width: brickWidth,
      height: brickHeight,
      health: health,
      restitution: BRICK_DEFAULTS.restitution,
      friction: BRICK_DEFAULTS.friction,
    });
  }
  return bricks;
};

const processLevelData = (levelData) => {
  const processed = {
    background: levelData.background,
    bricks: [],
    stock: levelData.stock || 20,
  };
  
  if (levelData.bricks && levelData.bricks.rows) {
    levelData.bricks.rows.forEach(rowConfig => {
      processed.bricks.push(...createBrickRow(rowConfig));
    });
  }
  
  return processed;
};

export const getLevelData = (levelNumber) => {
  const key = String(levelNumber);
  const levelData = levelsData[key] || levelsData['1'];
  return processLevelData(levelData);
};

export const getLevelCount = () => {
  return Object.keys(levelsData).length;
};
