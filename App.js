import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Dimensions, PanResponder } from 'react-native';
import { useState, useRef } from 'react';
import { SpaceBackground } from './components/SpaceBackground';
import { getCurrentLevel } from './levels';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [rotation, setRotation] = useState(0);
  const [currentLevel] = useState(1);
  const levelConfig = getCurrentLevel(currentLevel);

  const rotationRef = useRef(0);
  const startXRef = useRef(0);

  const panResponder = useRef(
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
        const clampedRotation = Math.max(-60, Math.min(0, targetRotation));
        setRotation(clampedRotation);
      },
      onPanResponderRelease: (event, gestureState) => {
        const deltaX = gestureState.dx;
        const deltaRotation = (deltaX / width) * 60;
        const targetRotation = rotationRef.current + deltaRotation;
        rotationRef.current = Math.max(-60, Math.min(0, targetRotation));
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <SpaceBackground config={levelConfig.background} />
      <StatusBar style="light" />
      
      <View style={styles.cannonContainer}>
        <Image 
          source={require('./assets/canon/socle.png')} 
          style={styles.base}
          resizeMode="contain"
        />
        <Image 
          source={require('./assets/canon/canon-midi.png')} 
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
}

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
});
