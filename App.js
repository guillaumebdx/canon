import { useState, useEffect, useCallback } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';
import { getLevelCount } from './utils/levelLoader';
import { initDatabase, getAllProgress, saveLevelProgress, resetAllProgress, debugSetLevel } from './services/database';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [levelStars, setLevelStars] = useState({});
  const [isDbReady, setIsDbReady] = useState(false);

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
    />
  );
}
