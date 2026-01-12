import { useState } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';

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

  if (currentScreen === 'menu') {
    return <MenuScreen onStartLevel={handleStartLevel} />;
  }

  return <GameScreen level={selectedLevel} onBackToMenu={handleBackToMenu} />;
}
