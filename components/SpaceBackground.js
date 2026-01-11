import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const generateStars = (config) => {
  const stars = [];
  for (let i = 0; i < config.count; i++) {
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
    const opacity = config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity);
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const glowSize = size * (2 + Math.random() * 2);
    
    stars.push({
      id: i,
      x,
      y,
      size,
      opacity,
      color,
      glowSize,
    });
  }
  return stars;
};

const Star = ({ star }) => {
  return (
    <View
      style={[
        styles.starContainer,
        {
          left: `${star.x}%`,
          top: `${star.y}%`,
        },
      ]}
    >
      <View
        style={[
          styles.starGlow,
          {
            width: star.glowSize,
            height: star.glowSize,
            backgroundColor: star.color,
            opacity: star.opacity * 0.3,
            borderRadius: star.glowSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.starCore,
          {
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            opacity: star.opacity,
            borderRadius: star.size / 2,
          },
        ]}
      />
    </View>
  );
};

const NebulaClouds = ({ clouds }) => {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        {clouds.map((cloud, index) => (
          <RadialGradient
            key={`grad-${index}`}
            id={`nebula-${index}`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0%" stopColor={cloud.color} stopOpacity={cloud.opacity || 0.4} />
            <Stop offset="30%" stopColor={cloud.color} stopOpacity={(cloud.opacity || 0.4) * 0.6} />
            <Stop offset="60%" stopColor={cloud.color} stopOpacity={(cloud.opacity || 0.4) * 0.3} />
            <Stop offset="100%" stopColor={cloud.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {clouds.map((cloud, index) => {
        const x = parseFloat(cloud.x) / 100 * width;
        const y = parseFloat(cloud.y) / 100 * height;
        return (
          <Circle
            key={`circle-${index}`}
            cx={x}
            cy={y}
            r={cloud.size}
            fill={`url(#nebula-${index})`}
          />
        );
      })}
    </Svg>
  );
};

export const SpaceBackground = ({ config }) => {
  const stars = useMemo(() => generateStars(config.stars), [config.stars]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.gradientColors}
        locations={config.gradientLocations}
        style={styles.gradient}
      />
      <NebulaClouds clouds={config.nebulaClouds} />
      {stars.map((star) => (
        <Star key={star.id} star={star} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  nebula: {
    position: 'absolute',
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  starContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlow: {
    position: 'absolute',
  },
  starCore: {
    position: 'absolute',
  },
});
