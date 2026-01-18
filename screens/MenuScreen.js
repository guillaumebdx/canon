import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, Switch, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const TOTAL_LEVELS = 100;
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

const LevelNode = ({ position, onPress, isUnlocked, earnedStars }) => {
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
      activeOpacity={isUnlocked ? 0.7 : 1}
      disabled={!isUnlocked}
    >
      {isUnlocked && (
        <>
          <View style={[styles.levelTrail, styles.levelTrail1]} />
          <View style={[styles.levelTrail, styles.levelTrail2]} />
          <View style={[styles.levelTrail, styles.levelTrail3]} />
        </>
      )}
      <View style={[styles.levelCircle, !isUnlocked && styles.levelCircleLocked]}>
        <View style={styles.starsRow}>
          {[1, 2, 3].map((starNum) => (
            <Text 
              key={starNum} 
              style={[
                styles.starIcon, 
                starNum <= earnedStars ? styles.starEarned : styles.starEmpty
              ]}
            >
              ★
            </Text>
          ))}
        </View>
        <Text style={[styles.levelNumber, !isUnlocked && styles.levelNumberLocked]}>
          {position.level}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ConnectionLine = ({ from, to }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  return (
    <View
      style={{
        position: 'absolute',
        left: from.x,
        top: from.y,
        width: length,
        height: 2,
        backgroundColor: '#66aaff',
        opacity: 0.6,
        transform: [{ rotate: `${angle}deg` }],
        transformOrigin: 'left center',
      }}
    />
  );
};

const ConstellationLines = ({ positions }) => {
  return (
    <>
      {positions.map((pos, index) => {
        if (index === 0) return null;
        const prevPos = positions[index - 1];
        return (
          <ConnectionLine key={`line-${index}`} from={prevPos} to={pos} />
        );
      })}
    </>
  );
};

const CheckpointBar = ({ checkpoint, totalStars, onPress }) => {
  const isUnlocked = totalStars >= checkpoint.requiredStars;
  return (
    <View style={styles.checkpointBar}>
      <View style={[styles.checkpointLine, isUnlocked && styles.checkpointLineUnlocked]} />
      <TouchableOpacity 
        style={[styles.checkpointBadge, isUnlocked && styles.checkpointBadgeUnlocked]}
        onPress={() => !isUnlocked && onPress && onPress(checkpoint)}
        activeOpacity={isUnlocked ? 1 : 0.7}
      >
        <Text style={styles.checkpointStars}>★ {checkpoint.requiredStars}</Text>
        {!isUnlocked && <Text style={styles.checkpointLabel}>requis</Text>}
        {isUnlocked && <Text style={styles.checkpointLabelUnlocked}>✓</Text>}
      </TouchableOpacity>
      <View style={[styles.checkpointLine, isUnlocked && styles.checkpointLineUnlocked]} />
    </View>
  );
};

export const MenuScreen = ({ onStartLevel, soundEnabled, setSoundEnabled, maxLevelUnlocked, levelStars, onResetProgress, onDebugSetLevel, totalStars, checkpointInfo }) => {
  const stars = useMemo(() => generateStars(400), []);
  const levelPositions = useMemo(() => generateLevelPositions(), []);
  const scrollViewRef = useRef(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [creditsVisible, setCreditsVisible] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [checkpointModalVisible, setCheckpointModalVisible] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const titleClickCount = useRef(0);
  const titleClickTimer = useRef(null);

  const handleCheckpointPress = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setCheckpointModalVisible(true);
  };

  const handleTitlePress = () => {
    titleClickCount.current += 1;
    
    if (titleClickTimer.current) {
      clearTimeout(titleClickTimer.current);
    }
    
    if (titleClickCount.current >= 7) {
      titleClickCount.current = 0;
      setDebugVisible(true);
    } else {
      titleClickTimer.current = setTimeout(() => {
        titleClickCount.current = 0;
      }, 2000);
    }
  };

  const handleDebugSelectLevel = (level) => {
    if (onDebugSetLevel) {
      onDebugSetLevel(level);
    }
    setDebugVisible(false);
  };

  const isLevelBlocked = (level) => {
    if (level > maxLevelUnlocked) return true;
    const checkpoint = checkpointInfo?.find(cp => cp.level === level);
    if (checkpoint && checkpoint.isBlocked) return true;
    return false;
  };

  const handleLevelPress = (level) => {
    if (!isLevelBlocked(level)) {
      onStartLevel(level);
    }
  };

  const handleResetConfirm = () => {
    onResetProgress();
    setResetConfirmVisible(false);
    setSettingsVisible(false);
  };

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
        <TouchableOpacity onPress={handleTitlePress} activeOpacity={1}>
          <Text style={styles.titleText}>BRICK SHOT</Text>
        </TouchableOpacity>
        <Text style={styles.titleTextGalaxy}>GALAXY</Text>
        <View style={styles.totalStarsContainer}>
          <Text style={styles.totalStarsIcon}>★</Text>
          <Text style={styles.totalStarsText}>{totalStars || 0}</Text>
        </View>
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
              style={[styles.settingButton, styles.resetButton]}
              onPress={() => setResetConfirmVisible(true)}
            >
              <Text style={[styles.settingButtonText, styles.resetButtonText]}>Recommencer à zéro</Text>
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

      <Modal
        visible={resetConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResetConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ ATTENTION</Text>
            
            <Text style={styles.resetWarningText}>
              Êtes-vous sûr de vouloir{'\n'}
              recommencer à zéro ?{'\n\n'}
              Toute votre progression{'\n'}
              sera effacée !
            </Text>

            <View style={styles.resetButtonsRow}>
              <Pressable 
                style={[styles.resetConfirmButton, styles.resetCancelButton]}
                onPress={() => setResetConfirmVisible(false)}
              >
                <Text style={styles.resetCancelButtonText}>Annuler</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.resetConfirmButton, styles.resetDeleteButton]}
                onPress={handleResetConfirm}
              >
                <Text style={styles.resetDeleteButtonText}>Effacer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={debugVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDebugVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🛠️ DEBUG MODE</Text>
            
            <Text style={styles.debugText}>
              Sélectionner un niveau{'\n'}
              (3★ sur tous les précédents)
            </Text>

            <ScrollView style={styles.debugScrollView} contentContainerStyle={styles.debugGrid}>
              {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={styles.debugLevelButton}
                  onPress={() => handleDebugSelectLevel(lvl)}
                >
                  <Text style={styles.debugLevelText}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Pressable 
              style={styles.closeButton}
              onPress={() => setDebugVisible(false)}
            >
              <Text style={styles.closeButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={checkpointModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCheckpointModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkpointModalContent}>
            <Text style={styles.checkpointModalTitle}>🚧 CHECKPOINT</Text>
            
            {selectedCheckpoint && (
              <>
                <Text style={styles.checkpointModalMessage}>
                  Pour débloquer le niveau {selectedCheckpoint.level},{'\n'}
                  tu dois obtenir {selectedCheckpoint.requiredStars} ★
                </Text>
                
                <View style={styles.checkpointModalStarsRow}>
                  <Text style={styles.checkpointModalCurrentStars}>★ {totalStars}</Text>
                  <Text style={styles.checkpointModalSlash}>/</Text>
                  <Text style={styles.checkpointModalRequiredStars}>{selectedCheckpoint.requiredStars}</Text>
                </View>
                
                <Text style={styles.checkpointModalHint}>
                  Il te manque {selectedCheckpoint.requiredStars - totalStars} ★{'\n'}
                  Rejoue des niveaux pour améliorer tes scores !
                </Text>
              </>
            )}

            <Pressable 
              style={styles.closeButton}
              onPress={() => setCheckpointModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Compris !</Text>
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
            onPress={handleLevelPress}
            isUnlocked={!isLevelBlocked(position.level)}
            earnedStars={levelStars[position.level] || 0}
          />
        ))}
        
        {checkpointInfo && checkpointInfo.map((checkpoint) => {
          const prevLevelPos = levelPositions[checkpoint.level - 2];
          const checkpointLevelPos = levelPositions[checkpoint.level - 1];
          if (!prevLevelPos || !checkpointLevelPos) return null;
          const yPosition = (prevLevelPos.y + checkpointLevelPos.y) / 2;
          return (
            <View 
              key={`checkpoint-${checkpoint.level}`} 
              style={[styles.checkpointBarContainer, { top: yPosition - 25 }]}
            >
              <CheckpointBar checkpoint={checkpoint} totalStars={totalStars} onPress={handleCheckpointPress} />
            </View>
          );
        })}
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
    zIndex: 10,
  },
  levelTrail: {
    position: 'absolute',
    borderRadius: NODE_SIZE,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  levelTrail1: {
    width: NODE_SIZE + 10,
    height: NODE_SIZE + 10,
    top: -5,
    left: -5,
    borderColor: 'rgba(102, 136, 255, 0.3)',
  },
  levelTrail2: {
    width: NODE_SIZE + 20,
    height: NODE_SIZE + 20,
    top: -10,
    left: -10,
    borderColor: 'rgba(102, 136, 255, 0.15)',
  },
  levelTrail3: {
    width: NODE_SIZE + 30,
    height: NODE_SIZE + 30,
    top: -15,
    left: -15,
    borderColor: 'rgba(102, 136, 255, 0.08)',
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
  levelCircleLocked: {
    backgroundColor: 'rgba(40, 40, 60, 0.7)',
    borderColor: '#444',
  },
  levelNumberLocked: {
    color: '#666',
    fontSize: 18,
  },
  starEarned: {
    color: '#ffd700',
  },
  starEmpty: {
    color: '#444',
    textShadowRadius: 0,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 50, 50, 0.2)',
    borderColor: '#ff4444',
  },
  resetButtonText: {
    color: '#ff6666',
  },
  resetWarningText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 25,
  },
  resetButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  resetConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetCancelButton: {
    backgroundColor: 'rgba(102, 136, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#6688ff',
  },
  resetCancelButtonText: {
    fontSize: 16,
    color: '#88aaff',
    fontWeight: 'bold',
  },
  resetDeleteButton: {
    backgroundColor: 'rgba(255, 50, 50, 0.4)',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  resetDeleteButtonText: {
    fontSize: 16,
    color: '#ff6666',
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  debugScrollView: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 20,
  },
  debugGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  debugLevelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 136, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#6688ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugLevelText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  totalStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  totalStarsIcon: {
    fontSize: 24,
    color: '#ffd700',
    marginRight: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  totalStarsText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  checkpointBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    zIndex: 50,
  },
  checkpointBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  checkpointLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#ff4466',
    opacity: 0.8,
  },
  checkpointLineUnlocked: {
    backgroundColor: '#44ff66',
  },
  checkpointBadge: {
    backgroundColor: 'rgba(255, 68, 102, 0.3)',
    borderWidth: 2,
    borderColor: '#ff4466',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 6,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  checkpointBadgeUnlocked: {
    backgroundColor: 'rgba(68, 255, 102, 0.3)',
    borderColor: '#44ff66',
  },
  checkpointStars: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: 'bold',
  },
  checkpointLabel: {
    fontSize: 10,
    color: '#ff6688',
    fontWeight: 'bold',
    marginTop: 2,
  },
  checkpointLabelUnlocked: {
    fontSize: 12,
    color: '#44ff66',
    fontWeight: 'bold',
  },
  checkpointModalContent: {
    backgroundColor: 'rgba(30, 30, 60, 0.95)',
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ff8800',
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
  },
  checkpointModalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ff8800',
    marginBottom: 20,
    textShadowColor: 'rgba(255, 136, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  checkpointModalMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  checkpointModalStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },
  checkpointModalCurrentStars: {
    fontSize: 24,
    color: '#ffd700',
    fontWeight: 'bold',
  },
  checkpointModalSlash: {
    fontSize: 24,
    color: '#888',
    marginHorizontal: 10,
  },
  checkpointModalRequiredStars: {
    fontSize: 24,
    color: '#ff8800',
    fontWeight: 'bold',
  },
  checkpointModalHint: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    fontStyle: 'italic',
  },
});
