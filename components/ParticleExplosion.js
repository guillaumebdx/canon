import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const PARTICLE_COUNT = 5;
const DURATION = 300;

export const ParticleExplosion = ({ x, y, color, onComplete }) => {
  const progress = useRef(new Animated.Value(0)).current;
  
  const particles = useMemo(() => {
    const result = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      result.push({
        id: i,
        vx: Math.cos(angle) * 60,
        vy: Math.sin(angle) * 60,
        size: 4 + Math.random() * 3,
      });
    }
    return result;
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      useNativeDriver: true,
    });
    
    animation.start(() => {
      if (onComplete) onComplete();
    });
    
    return () => {
      animation.stop();
      progress.setValue(0);
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.fragment,
            {
              left: x,
              top: y,
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              transform: [
                { translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, particle.vx],
                })},
                { translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, particle.vy + 40],
                })},
              ],
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.8, 0],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  fragment: {
    position: 'absolute',
    borderRadius: 2,
  },
});
