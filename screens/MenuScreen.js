import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const MenuScreen = ({ onStartLevel }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onStartLevel(1)}
      >
        <Text style={styles.buttonText}>Niveau 1</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, styles.buttonLevel2]} 
        onPress={() => onStartLevel(2)}
      >
        <Text style={styles.buttonText}>Niveau 2</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, styles.buttonLevel3]} 
        onPress={() => onStartLevel(3)}
      >
        <Text style={styles.buttonText}>Niveau 3</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, styles.buttonLevel4]} 
        onPress={() => onStartLevel(4)}
      >
        <Text style={styles.buttonText}>Niveau 4</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, styles.buttonLevel5]} 
        onPress={() => onStartLevel(5)}
      >
        <Text style={styles.buttonText}>Niveau 5</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, styles.buttonLevel6]} 
        onPress={() => onStartLevel(6)}
      >
        <Text style={styles.buttonText}>Niveau 6</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6633cc',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9966ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonLevel2: {
    marginTop: 20,
    backgroundColor: '#1a6644',
    borderColor: '#33aa77',
  },
  buttonLevel3: {
    marginTop: 20,
    backgroundColor: '#1a1a2e',
    borderColor: '#4a4a6e',
  },
  buttonLevel4: {
    marginTop: 20,
    backgroundColor: '#ff6b9d',
    borderColor: '#ffee58',
  },
  buttonLevel5: {
    marginTop: 20,
    backgroundColor: '#000033',
    borderColor: '#ffff00',
  },
  buttonLevel6: {
    marginTop: 20,
    backgroundColor: '#2d1b4e',
    borderColor: '#9944ff',
  },
});
