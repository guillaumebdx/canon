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
});
