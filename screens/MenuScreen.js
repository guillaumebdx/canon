import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, Switch, Pressable } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const TOTAL_LEVELS = 30;
const LEVEL_SPACING = 120;
const NODE_SIZE = 70;
const CONTENT_HEIGHT = TOTAL_LEVELS * LEVEL_SPACING + 200;

const seededRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const generateStars = (count) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: seededRandom(i * 3.7) * 100,
      y: seededRandom(i * 2.3) * 100,
      size: 1 + seededRandom(i * 5.1) * 3,
      opacity: 0.3 + seededRandom(i * 7.9) * 0.7,
      color: ['#ffffff', '#aaccff', '#ffaacc', '#aaffcc', '#ffffaa'][Math.floor(seededRandom(i * 11.3) * 5)],
    });
  }
  return stars;
};

const generateLevelPositions = () => {
  const positions = [];
  
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    let x;
    
    if (i === 0) {
      x = width / 2;
    } else {
      const prevX = positions[i - 1].x;
      const direction = seededRandom(i * 23.7) > 0.5 ? 1 : -1;
      x = prevX + direction * (40 + seededRandom(i * 31.1) * 80);
      x = Math.max(NODE_SIZE, Math.min(width - NODE_SIZE, x));
    }
    
    const y = 100 + (i * LEVEL_SPACING);
    positions.push({ level: i + 1, x, y, stars: 3 });
  }
  return positions;
};

const Star = ({ star }) => (
  <View
    style={[
      styles.star,
      {
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.size,
        height: star.size,
        backgroundColor: star.color,
        opacity: star.opacity,
      },
    ]}
  />
);

const LevelNode = ({ position, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.levelNode,
        {
          left: position.x - NODE_SIZE / 2,
          top: position.y - NODE_SIZE / 2,
        },
      ]}
      onPress={() => onPress(position.level)}
      activeOpacity={0.7}
    >
      <View style={styles.levelCircle}>
        <View style={styles.starsRow}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.starIcon}>★</Text>
        </View>
        <Text style={styles.levelNumber}>{position.level}</Text>
      </View>
    </TouchableOpacity>
  );
};

const ConstellationLines = ({ positions }) => {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={CONTENT_HEIGHT}>
      <Defs>
        <RadialGradient id="lineGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#66aaff" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#66aaff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {positions.map((pos, index) => {
        if (index === 0) return null;
        const prevPos = positions[index - 1];
        return (
          <React.Fragment key={`line-${index}`}>
            <Line
              x1={prevPos.x}
              y1={prevPos.y}
              x2={pos.x}
              y2={pos.y}
              stroke="#66aaff"
              strokeWidth={2}
              opacity={0.6}
            />
            <Line
              x1={prevPos.x}
              y1={prevPos.y}
              x2={pos.x}
              y2={pos.y}
              stroke="#aaddff"
              strokeWidth={1}
              opacity={0.9}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

export const MenuScreen = ({ onStartLevel, soundEnabled, setSoundEnabled }) => {
  const stars = useMemo(() => generateStars(400), []);
  const levelPositions = useMemo(() => generateLevelPositions(), []);
  const scrollViewRef = useRef(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [creditsVisible, setCreditsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a2e', '#1a1a4e', '#2a2a6e', '#1a1a4e', '#0a0a2e']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <Star key={star.id} star={star} />
        ))}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>BRICK SHOT</Text>
        <Text style={styles.titleTextGalaxy}>GALAXY</Text>
      </View>

      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => setSettingsVisible(true)}
      >
        <View style={styles.settingsIconContainer}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PARAMÈTRES</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Son</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#555', true: '#66aaff' }}
                thumbColor={soundEnabled ? '#fff' : '#aaa'}
              />
            </View>

            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => {
                setSettingsVisible(false);
                setCreditsVisible(true);
              }}
            >
              <Text style={styles.settingButtonText}>Crédits</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => {}}
            >
              <Text style={styles.settingButtonText}>Recommencer à zéro</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Version 1.0.0</Text>

            <Pressable 
              style={styles.closeButton}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={creditsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCreditsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CRÉDITS</Text>
            
            <Text style={styles.creditsText}>
              App construite avec ❤️{'\n'}
              par Guillaume HARARI{'\n'}
              (vibe codé 😉)
            </Text>

            <Pressable 
              style={styles.closeButton}
              onPress={() => setCreditsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{ height: CONTENT_HEIGHT, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ConstellationLines positions={levelPositions} />
        
        {levelPositions.map((position) => (
          <LevelNode
            key={position.level}
            position={position}
            onPress={onStartLevel}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  levelNode: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
  },
  levelCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(30, 30, 80, 0.9)',
    borderWidth: 3,
    borderColor: '#6688ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6688ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  starIcon: {
    fontSize: 12,
    color: '#ffd700',
    marginHorizontal: 1,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  levelNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  titleContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    zIndex: 100,
  },
  titleText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: '#6688ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleTextGalaxy: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginTop: -5,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 200,
  },
  settingsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 136, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#6688ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    color: '#88aaff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 60, 0.95)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6688ff',
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textShadowColor: '#6688ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  settingButton: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(102, 136, 255, 0.3)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6688ff',
    marginBottom: 15,
    alignItems: 'center',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    marginBottom: 20,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6688ff',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#88aaff',
    fontWeight: 'bold',
  },
  creditsText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 30,
  },
});
