import { useState } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';
import { getLevelCount } from './utils/levelLoader';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleStartLevel = (level) => {
    setSelectedLevel(level);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleNextLevel = () => {
    const nextLevel = selectedLevel + 1;
    if (nextLevel <= getLevelCount()) {
      setSelectedLevel(nextLevel);
    } else {
      setCurrentScreen('menu');
    }
  };

  if (currentScreen === 'menu') {
    return <MenuScreen onStartLevel={handleStartLevel} />;
  }

  return <GameScreen level={selectedLevel} onBackToMenu={handleBackToMenu} onNextLevel={handleNextLevel} />;
}
