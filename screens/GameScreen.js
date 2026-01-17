import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Dimensions, PanResponder, Pressable, Text, Animated } from 'react-native';
import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SpaceBackground } from '../components/SpaceBackground';
import { ParticleExplosion } from '../components/ParticleExplosion';
import { getLevelData } from '../utils/levelLoader';
import { BRICK_COLORS } from '../config/gameConfig';
import { PhysicsEngine } from '../game/PhysicsEngine';

const soundFiles = {
  victory: require('../assets/sounds/victory.wav'),
  star: require('../assets/sounds/star.wav'),
};

let loadedSounds = {};
let soundEnabledRef = true;

const loadSounds = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    
    for (const [name, file] of Object.entries(soundFiles)) {
      const { sound } = await Audio.Sound.createAsync(file);
      loadedSounds[name] = sound;
    }
  } catch (error) {
    console.log('Error loading sounds:', error);
  }
};

const playSound = async (soundName) => {
  if (!soundEnabledRef) return;
  try {
    const sound = loadedSounds[soundName];
    if (sound) {
      await sound.replayAsync();
    }
  } catch (error) {
    console.log('Error playing sound:', error);
  }
};

const unloadSounds = async () => {
  try {
    for (const sound of Object.values(loadedSounds)) {
      await sound.unloadAsync();
    }
    loadedSounds = {};
  } catch (error) {
    console.log('Error unloading sounds:', error);
  }
};

const { width, height } = Dimensions.get('window');

const MILESTONE_MESSAGES = [
  'BIEN JOUÉ !',
  'EXCELLENT !',
  'SUPERBE !',
  'GÉNIAL !',
  'INCROYABLE !',
  'FANTASTIQUE !',
  'IMPRESSIONNANT !',
  'MAGNIFIQUE !',
  'BRAVO !',
  'CONTINUE !',
  'EN FEU !',
  'UNSTOPPABLE !',
];

const getRandomMessage = () => {
  return MILESTONE_MESSAGES[Math.floor(Math.random() * MILESTONE_MESSAGES.length)];
};

const CANNON_POSITION = { x: width / 2, y: height - 80 };
const BALL_SIZE = 12;
const SHOOT_INTERVAL = 200;

const Ball = memo(({ ball }) => {
  return (
    <View
      style={[
        styles.ball,
        {
          left: ball.x - BALL_SIZE / 2,
          top: ball.y - BALL_SIZE / 2,
        },
      ]}
    />
  );
});

const Brick = memo(({ brick }) => {
  const color = BRICK_COLORS[brick.health] || '#ffaa44';
  return (
    <View
      style={[
        styles.brick,
        {
          left: brick.x - brick.width / 2,
          top: brick.y - brick.height / 2,
          width: brick.width,
          height: brick.height,
          backgroundColor: color,
        },
      ]}
    />
  );
});

const StartButton = ({ onStart }) => {
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const wave3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWaveAnimation = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createWaveAnimation(wave1Anim, 0);
    const anim2 = createWaveAnimation(wave2Anim, 500);
    const anim3 = createWaveAnimation(wave3Anim, 1000);
    
    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const renderWave = (anim, index) => (
    <Animated.View
      key={index}
      style={[
        styles.startWave,
        {
          opacity: anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 0.3, 0],
          }),
          transform: [{
            scale: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.5],
            }),
          }],
        },
      ]}
    />
  );

  return (
    <View style={styles.startOverlay}>
      <View style={styles.startButtonContainer}>
        {renderWave(wave1Anim, 1)}
        {renderWave(wave2Anim, 2)}
        {renderWave(wave3Anim, 3)}
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: false }}
        >
          <Text style={styles.startButtonText}>START</Text>
        </Pressable>
      </View>
    </View>
  );
};

const Countdown = ({ count }) => {
  return (
    <View style={styles.countdownOverlay} pointerEvents="none">
      <Text style={styles.countdownText}>{count}</Text>
    </View>
  );
};

const StarDisplay = ({ count, animated }) => {
  const star1Anim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const star2Anim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const star3Anim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated && count >= 1) {
      const animations = [];
      if (count >= 1) animations.push(Animated.spring(star1Anim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }));
      if (count >= 2) animations.push(Animated.spring(star2Anim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }));
      if (count >= 3) animations.push(Animated.spring(star3Anim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }));
      Animated.stagger(120, animations).start();
    }
  }, [animated, count]);

  const renderStar = (filled, animValue, key) => (
    <Animated.Text
      key={key}
      style={[
        styles.starIcon,
        filled ? styles.starFilled : styles.starEmpty,
        animated && filled ? { transform: [{ scale: animValue }] } : null,
      ]}
    >
      ★
    </Animated.Text>
  );

  return (
    <View style={styles.starsContainer}>
      {renderStar(count >= 1, star1Anim, 1)}
      {renderStar(count >= 2, star2Anim, 2)}
      {renderStar(count >= 3, star3Anim, 3)}
    </View>
  );
};

const MilestoneMessage = ({ message, starCount, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1.2, friction: 4, tension: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onComplete && onComplete());
  }, []);

  return (
    <Animated.View
      style={[
        styles.milestoneContainer,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.milestoneText}>{message}</Text>
      <StarDisplay count={starCount} animated={false} />
    </Animated.View>
  );
};

const ResultScreen = ({ won, onRetry, onNextLevel, onBackToMenu, starCount }) => {
  return (
    <View style={styles.resultOverlay}>
      <View style={styles.resultFrame}>
          <Text style={[styles.resultTitle, won ? styles.resultWon : styles.resultLost]}>
            {won ? 'NIVEAU RÉUSSI !' : 'NIVEAU RATÉ'}
          </Text>
          {won && <StarDisplay count={starCount} animated={true} />}
          
          <View style={styles.resultButtonsRow}>
            {won && (
              <Pressable
                onPress={onNextLevel}
                style={({ pressed }) => [
                  styles.resultButton,
                  styles.nextLevelButton,
                  pressed && styles.buttonPressed,
                ]}
                >
                <Text style={styles.resultButtonText}>SUIVANT</Text>
              </Pressable>
            )}
            
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [
                styles.resultButton,
                styles.replayButton,
                pressed && styles.buttonPressed,
              ]}
              >
              <Text style={styles.resultButtonText}>REJOUER</Text>
            </Pressable>
          </View>
          
          <Pressable
            onPress={onBackToMenu}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.buttonPressed,
            ]}
            >
            <Text style={styles.menuButtonText}>MENU</Text>
          </Pressable>
        </View>
    </View>
  );
};

const StockGauge = ({ stock, maxStock }) => {
  const fillPercent = maxStock > 0 ? (stock / maxStock) * 100 : 0;
  
  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeOuter}>
        <View style={[styles.gaugeFill, { height: `${fillPercent}%` }]} />
      </View>
      <Text style={styles.gaugeText}>{stock}</Text>
    </View>
  );
};

const GAME_PHASE = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

export const GameScreen = ({ level, onBackToMenu, onNextLevel, soundEnabled }) => {
  const [rotation, setRotation] = useState(0);
  const [gameState, setGameState] = useState({ balls: [], bricks: [], score: 0 });
  const [activeExplosions, setActiveExplosions] = useState([]);
  const [gamePhase, setGamePhase] = useState(GAME_PHASE.IDLE);
  const [countdown, setCountdown] = useState(3);
  const [stock, setStock] = useState(0);
  const [currentStars, setCurrentStars] = useState(0);
  const [milestoneMessage, setMilestoneMessage] = useState(null);
  const levelConfig = useMemo(() => getLevelData(level), [level]);

  const rotationRef = useRef(0);
  const physicsEngineRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const stockRef = useRef(0);

  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  useEffect(() => {
    soundEnabledRef = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    setStock(levelConfig.stock);
    stockRef.current = levelConfig.stock;
    setGamePhase(GAME_PHASE.IDLE);
    setRotation(0);
    rotationRef.current = 0;
    setActiveExplosions([]);
    setCountdown(3);
    setCurrentStars(0);
    setMilestoneMessage(null);
  }, [level]);

  useEffect(() => {
    physicsEngineRef.current = new PhysicsEngine();
    physicsEngineRef.current.loadLevel(levelConfig);

    const unsubscribe = physicsEngineRef.current.subscribe((state) => {
      setGameState(state);
      if (state.explosions && state.explosions.length > 0) {
        setActiveExplosions(prev => [...prev, ...state.explosions]);
      }
      if (state.soundEvents && state.soundEvents.length > 0) {
        state.soundEvents.forEach(soundName => playSound(soundName));
      }
      if (state.hapticEvents && state.hapticEvents.length > 0) {
        state.hapticEvents.forEach(intensity => {
          if (intensity === 'light') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (intensity === 'medium') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        });
      }
    });

    lastTimeRef.current = performance.now();

    const gameLoop = (currentTime) => {
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 32);
      lastTimeRef.current = currentTime;

      if (physicsEngineRef.current) {
        const cannonX = CANNON_POSITION.x + rotationRef.current * 0.3;
        const cannonY = CANNON_POSITION.y - 30;
        physicsEngineRef.current.update(deltaTime, currentTime, cannonX, cannonY, rotationRef.current);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (physicsEngineRef.current) {
        physicsEngineRef.current.destroy();
      }
      unsubscribe();
    };
  }, [levelConfig]);

  useEffect(() => {
    if (gamePhase !== GAME_PHASE.PLAYING) return;

    const shootInterval = setInterval(() => {
      if (physicsEngineRef.current && stockRef.current > 0) {
        const cannonX = CANNON_POSITION.x + rotationRef.current * 0.5;
        const cannonY = CANNON_POSITION.y + 20;
        physicsEngineRef.current.shootBall(cannonX, cannonY, rotationRef.current);
        stockRef.current -= 1;
        setStock(stockRef.current);
      }
    }, SHOOT_INTERVAL);

    return () => clearInterval(shootInterval);
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase !== GAME_PHASE.COUNTDOWN) return;

    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGamePhase(GAME_PHASE.PLAYING);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase !== GAME_PHASE.PLAYING) return;
    
    const destroyed = gameState.bricksDestroyed || 0;
    const totalBricks = gameState.totalBricks || 1;
    const percentage = (destroyed / totalBricks) * 100;
    
    let newStars = 0;
    if (percentage >= 100) newStars = 3;
    else if (percentage >= 90) newStars = 2;
    else if (percentage >= 70) newStars = 1;
    
    if (newStars > currentStars) {
      setCurrentStars(newStars);
      if (newStars < 3) {
        setMilestoneMessage({ text: getRandomMessage(), stars: newStars });
        playSound('star');
      }
    }
    
    if (gameState.bricks.length === 0) {
      setGamePhase(GAME_PHASE.WON);
      playSound('victory');
      return;
    }
    
    if (stockRef.current <= 0 && gameState.balls.length === 0) {
      if (currentStars >= 1 || newStars >= 1) {
        setGamePhase(GAME_PHASE.WON);
        playSound('victory');
      } else {
        setGamePhase(GAME_PHASE.LOST);
      }
    }
  }, [gamePhase, gameState.bricks.length, gameState.balls.length, gameState.bricksDestroyed]);

  const handleStart = () => {
    setGamePhase(GAME_PHASE.COUNTDOWN);
  };

  const handleRetry = () => {
    setGamePhase(GAME_PHASE.IDLE);
    setStock(levelConfig.stock);
    stockRef.current = levelConfig.stock;
    setRotation(0);
    rotationRef.current = 0;
    setActiveExplosions([]);
    setCurrentStars(0);
    setMilestoneMessage(null);
    if (physicsEngineRef.current) {
      physicsEngineRef.current.loadLevel(levelConfig);
    }
  };

  const startRotationRef = useRef(0);
  
  const canMove = gamePhase === GAME_PHASE.COUNTDOWN || gamePhase === GAME_PHASE.PLAYING;
  
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => canMove,
      onMoveShouldSetPanResponder: () => canMove,
      onPanResponderGrant: () => {
        startRotationRef.current = rotationRef.current;
      },
      onPanResponderMove: (event, gestureState) => {
        const deltaX = gestureState.dx;
        const deltaRotation = (deltaX / width) * 160;
        const targetRotation = startRotationRef.current + deltaRotation;
        const clampedRotation = Math.max(-80, Math.min(80, targetRotation));
        rotationRef.current = clampedRotation;
        setRotation(clampedRotation);
      },
    }), [canMove]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <SpaceBackground config={levelConfig.background} />
      <StatusBar style="light" />
      
      {gameState.bricks.map(brick => (
        <Brick key={brick.id} brick={brick} />
      ))}
      
      {gameState.balls.map(ball => (
        <Ball key={ball.id} ball={ball} />
      ))}
      
      {activeExplosions.map(explosion => (
        <ParticleExplosion
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          color={BRICK_COLORS[explosion.health] || BRICK_COLORS[1]}
          onComplete={() => {
            setActiveExplosions(prev => prev.filter(e => e.id !== explosion.id));
          }}
        />
      ))}
      
      <StockGauge stock={stock} maxStock={levelConfig.stock} />
      
      <View style={styles.cannonContainer}>
        <Image 
          source={require('../assets/canon/socle.png')} 
          style={styles.base}
          resizeMode="contain"
        />
        <Image 
          source={require('../assets/canon/canon-midi.png')} 
          style={[styles.cannon, { 
            transform: [
              { translateX: rotation * 0.3 },
              { rotate: `${rotation}deg` }
            ] 
          }]}
          resizeMode="contain"
        />
      </View>
      
      {gamePhase === GAME_PHASE.IDLE && <StartButton onStart={handleStart} />}
      {gamePhase === GAME_PHASE.COUNTDOWN && <Countdown count={countdown} />}
      {(gamePhase === GAME_PHASE.WON || gamePhase === GAME_PHASE.LOST) && (
        <ResultScreen won={gamePhase === GAME_PHASE.WON} onRetry={handleRetry} onNextLevel={onNextLevel} onBackToMenu={onBackToMenu} starCount={currentStars} />
      )}
      {milestoneMessage && (
        <MilestoneMessage
          message={milestoneMessage.text}
          starCount={milestoneMessage.stars}
          onComplete={() => setMilestoneMessage(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cannonContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  base: {
    position: 'absolute',
    width: 75,
    height: 75,
    bottom: 0,
  },
  cannon: {
    position: 'absolute',
    width: 60,
    height: 60,
    bottom: 42,
  },
  brick: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  gaugeContainer: {
    position: 'absolute',
    right: 15,
    bottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 30, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 150, 255, 0.3)',
  },
  gaugeOuter: {
    width: 20,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 150, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  gaugeFill: {
    width: '100%',
    backgroundColor: '#00ccff',
    borderRadius: 8,
    opacity: 0.8,
  },
  gaugeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(102, 68, 170, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9966ff',
    zIndex: 1000,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 2000,
  },
  startButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  startWave: {
    position: 'absolute',
    width: 220,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#ff66aa',
  },
  startButton: {
    backgroundColor: 'rgba(20, 10, 40, 0.9)',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#6688ff',
    shadowColor: '#ff66aa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 10,
  },
  startButtonPressed: {
    backgroundColor: 'rgba(30, 20, 60, 0.9)',
    transform: [{ scale: 0.95 }],
  },
  startButtonText: {
    color: '#ffd700',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  countdownText: {
    color: '#fff',
    fontSize: 120,
    fontWeight: 'bold',
    textShadowColor: '#aa66ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
  },
  resultFrame: {
    backgroundColor: 'rgba(10, 5, 30, 0.95)',
    paddingHorizontal: 35,
    paddingVertical: 30,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6688ff',
    alignItems: 'center',
    shadowColor: '#aa66ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  resultWon: {
    color: '#44ff88',
    textShadowColor: 'rgba(68, 255, 136, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  resultLost: {
    color: '#ff4466',
    textShadowColor: 'rgba(255, 68, 102, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  resultButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  nextLevelButton: {
    backgroundColor: 'rgba(34, 170, 68, 0.3)',
    borderColor: '#44ff88',
  },
  replayButton: {
    backgroundColor: 'rgba(102, 51, 204, 0.3)',
    borderColor: '#aa66ff',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  resultButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6688ff',
  },
  menuButtonText: {
    color: '#88aaff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  starIcon: {
    fontSize: 50,
    marginHorizontal: 8,
  },
  starFilled: {
    color: '#ffd700',
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  starEmpty: {
    color: '#444',
    textShadowColor: 'transparent',
  },
  milestoneContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3000,
  },
  milestoneText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#ffd700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
  },
});
