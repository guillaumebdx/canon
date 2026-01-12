import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Dimensions, PanResponder, TouchableOpacity, Text } from 'react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { SpaceBackground } from '../components/SpaceBackground';
import { getLevelData } from '../utils/levelLoader';
import { BRICK_COLORS } from '../config/gameConfig';
import { PhysicsEngine } from '../game/PhysicsEngine';

const { width, height } = Dimensions.get('window');

const CANNON_POSITION = { x: width - 60, y: height - 80 };
const BALL_SIZE = 12;

const Ball = ({ ball }) => {
  const size = BALL_SIZE * 2;
  return (
    <Svg
      width={size}
      height={size}
      style={{
        position: 'absolute',
        left: ball.x - size / 2,
        top: ball.y - size / 2,
      }}
    >
      <Defs>
        <RadialGradient id="ballGradient" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <Stop offset="20%" stopColor="#aaffff" stopOpacity={1} />
          <Stop offset="40%" stopColor="#00ffff" stopOpacity={0.9} />
          <Stop offset="70%" stopColor="#0088ff" stopOpacity={0.5} />
          <Stop offset="100%" stopColor="#0044aa" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#ballGradient)" />
    </Svg>
  );
};

const Brick = ({ brick }) => {
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
};

export const GameScreen = ({ level, onBackToMenu }) => {
  const [rotation, setRotation] = useState(0);
  const [gameState, setGameState] = useState({ balls: [], bricks: [], score: 0 });
  const levelConfig = useMemo(() => getLevelData(level), [level]);

  const rotationRef = useRef(0);
  const startXRef = useRef(0);
  const physicsEngineRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    physicsEngineRef.current = new PhysicsEngine();
    physicsEngineRef.current.loadLevel(levelConfig);

    const unsubscribe = physicsEngineRef.current.subscribe((state) => {
      setGameState(state);
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

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event, gestureState) => {
        startXRef.current = gestureState.x0;
      },
      onPanResponderMove: (event, gestureState) => {
        const deltaX = gestureState.dx;
        const deltaRotation = (deltaX / width) * 60;
        const targetRotation = rotationRef.current + deltaRotation;
        const clampedRotation = Math.max(-80, Math.min(10, targetRotation));
        setRotation(clampedRotation);
      },
      onPanResponderRelease: (event, gestureState) => {
        const deltaX = gestureState.dx;
        const deltaRotation = (deltaX / width) * 60;
        const targetRotation = rotationRef.current + deltaRotation;
        rotationRef.current = Math.max(-80, Math.min(10, targetRotation));
        
        const isTap = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
        if (isTap && physicsEngineRef.current) {
          const cannonX = CANNON_POSITION.x + rotationRef.current * 0.3;
          const cannonY = CANNON_POSITION.y - 30;
          physicsEngineRef.current.shootBall(cannonX, cannonY, rotationRef.current);
        }
      },
    }), []);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <SpaceBackground config={levelConfig.background} />
      <StatusBar style="light" />
      
      <TouchableOpacity style={styles.backButton} onPress={onBackToMenu}>
        <Text style={styles.backButtonText}>← Menu</Text>
      </TouchableOpacity>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{gameState.score}</Text>
      </View>
      
      {gameState.bricks.map(brick => (
        <Brick key={brick.id} brick={brick} />
      ))}
      
      {gameState.balls.map(ball => (
        <Ball key={ball.id} ball={ball} />
      ))}
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  cannonContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: 10,
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
  scoreContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
  },
  scoreText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
});
