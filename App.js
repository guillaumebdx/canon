import { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';
import { getLevelCount } from './utils/levelLoader';
import { initDatabase, getAllProgress, saveLevelProgress, resetAllProgress, debugSetLevel } from './services/database';

const CHECKPOINT_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const STARS_PERCENTAGE_REQUIRED = 0.78;

const getRequiredStarsForCheckpoint = (checkpointLevel) => {
  const levelsBeforeCheckpoint = checkpointLevel - 1;
  const maxStars = levelsBeforeCheckpoint * 3;
  return Math.ceil(maxStars * STARS_PERCENTAGE_REQUIRED);
};

const getTotalStars = (levelStars) => {
  return Object.values(levelStars).reduce((sum, stars) => sum + stars, 0);
};

const isCheckpointBlocked = (nextLevel, totalStars) => {
  if (!CHECKPOINT_LEVELS.includes(nextLevel)) return false;
  const requiredStars = getRequiredStarsForCheckpoint(nextLevel);
  return totalStars < requiredStars;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [levelStars, setLevelStars] = useState({});
  const [isDbReady, setIsDbReady] = useState(false);

  const totalStars = useMemo(() => getTotalStars(levelStars), [levelStars]);

  useEffect(() => {
    initDatabase();
    const progress = getAllProgress();
    setMaxLevelUnlocked(progress.maxLevelUnlocked);
    setLevelStars(progress.levelStars);
    setIsDbReady(true);
  }, []);

  const refreshProgress = useCallback(() => {
    const progress = getAllProgress();
    setMaxLevelUnlocked(progress.maxLevelUnlocked);
    setLevelStars(progress.levelStars);
  }, []);

  const handleStartLevel = (level) => {
    setSelectedLevel(level);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    refreshProgress();
    setCurrentScreen('menu');
  };

  const handleNextLevel = () => {
    refreshProgress();
    const nextLevel = selectedLevel + 1;
    if (nextLevel <= getLevelCount() && nextLevel <= maxLevelUnlocked + 1) {
      setSelectedLevel(nextLevel);
    } else {
      setCurrentScreen('menu');
    }
  };

  const handleLevelComplete = useCallback((level, stars) => {
    const isNewUnlock = level >= maxLevelUnlocked;
    saveLevelProgress(level, stars, isNewUnlock);
    if (isNewUnlock) {
      setMaxLevelUnlocked(level + 1);
    }
    const currentBest = levelStars[level] || 0;
    if (stars > currentBest) {
      setLevelStars(prev => ({ ...prev, [level]: stars }));
    }
  }, [maxLevelUnlocked, levelStars]);

  const handleResetProgress = useCallback(() => {
    resetAllProgress();
    setMaxLevelUnlocked(1);
    setLevelStars({});
  }, []);

  const handleDebugSetLevel = useCallback((targetLevel) => {
    debugSetLevel(targetLevel);
    const newStars = {};
    for (let i = 1; i < targetLevel; i++) {
      newStars[i] = 3;
    }
    setLevelStars(newStars);
    setMaxLevelUnlocked(targetLevel);
  }, []);

  const checkpointInfo = useMemo(() => {
    return CHECKPOINT_LEVELS.map(level => ({
      level,
      requiredStars: getRequiredStarsForCheckpoint(level),
      isBlocked: isCheckpointBlocked(level, totalStars),
    }));
  }, [totalStars]);

  const getNextLevelCheckpointBlock = useCallback((currentLevel) => {
    const nextLevel = currentLevel + 1;
    if (!CHECKPOINT_LEVELS.includes(nextLevel)) return null;
    const requiredStars = getRequiredStarsForCheckpoint(nextLevel);
    if (totalStars >= requiredStars) return null;
    return {
      nextLevel,
      requiredStars,
      currentStars: totalStars,
      missingStars: requiredStars - totalStars,
    };
  }, [totalStars]);

  if (!isDbReady) {
    return null;
  }

  if (currentScreen === 'menu') {
    return (
      <MenuScreen 
        onStartLevel={handleStartLevel} 
        soundEnabled={soundEnabled} 
        setSoundEnabled={setSoundEnabled}
        maxLevelUnlocked={maxLevelUnlocked}
        levelStars={levelStars}
        onResetProgress={handleResetProgress}
        onDebugSetLevel={handleDebugSetLevel}
        totalStars={totalStars}
        checkpointInfo={checkpointInfo}
      />
    );
  }

  return (
    <GameScreen 
      level={selectedLevel} 
      onBackToMenu={handleBackToMenu} 
      onNextLevel={handleNextLevel} 
      soundEnabled={soundEnabled}
      onLevelComplete={handleLevelComplete}
      getNextLevelCheckpointBlock={getNextLevelCheckpointBlock}
    />
  );
}
