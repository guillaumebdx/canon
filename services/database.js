import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('canon_progress.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS progress (
      level INTEGER PRIMARY KEY,
      stars INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0
    );
  `);
  
  db.execSync(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      max_level_unlocked INTEGER DEFAULT 1
    );
  `);
  
  const state = db.getFirstSync('SELECT * FROM game_state WHERE id = 1');
  if (!state) {
    db.runSync('INSERT INTO game_state (id, max_level_unlocked) VALUES (1, 1)');
  }
};

export const getMaxLevelUnlocked = () => {
  const result = db.getFirstSync('SELECT max_level_unlocked FROM game_state WHERE id = 1');
  return result ? result.max_level_unlocked : 1;
};

export const getLevelStars = (level) => {
  const result = db.getFirstSync('SELECT stars FROM progress WHERE level = ?', [level]);
  return result ? result.stars : 0;
};

export const getAllProgress = () => {
  const maxLevel = getMaxLevelUnlocked();
  const rows = db.getAllSync('SELECT level, stars FROM progress');
  
  const starsMap = {};
  rows.forEach(row => {
    starsMap[row.level] = row.stars;
  });
  
  return {
    maxLevelUnlocked: maxLevel,
    levelStars: starsMap,
  };
};

export const saveLevelProgress = (level, stars, isNewLevelUnlock) => {
  const currentStars = getLevelStars(level);
  const bestStars = Math.max(currentStars, stars);
  
  const existing = db.getFirstSync('SELECT * FROM progress WHERE level = ?', [level]);
  if (existing) {
    db.runSync('UPDATE progress SET stars = ?, completed = 1 WHERE level = ?', [bestStars, level]);
  } else {
    db.runSync('INSERT INTO progress (level, stars, completed) VALUES (?, ?, 1)', [level, bestStars]);
  }
  
  if (isNewLevelUnlock) {
    const currentMax = getMaxLevelUnlocked();
    const newMax = level + 1;
    if (newMax > currentMax) {
      db.runSync('UPDATE game_state SET max_level_unlocked = ? WHERE id = 1', [newMax]);
    }
  }
};

export const resetAllProgress = () => {
  db.runSync('DELETE FROM progress');
  db.runSync('UPDATE game_state SET max_level_unlocked = 1 WHERE id = 1');
};

export const debugSetLevel = (targetLevel) => {
  for (let i = 1; i < targetLevel; i++) {
    const existing = db.getFirstSync('SELECT * FROM progress WHERE level = ?', [i]);
    if (existing) {
      db.runSync('UPDATE progress SET stars = 3, completed = 1 WHERE level = ?', [i]);
    } else {
      db.runSync('INSERT INTO progress (level, stars, completed) VALUES (?, 3, 1)', [i]);
    }
  }
  db.runSync('UPDATE game_state SET max_level_unlocked = ? WHERE id = 1', [targetLevel]);
};
