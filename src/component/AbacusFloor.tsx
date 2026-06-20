import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../screens/theme';

// A wooden rod with bead-knob ends, standing in for "the floor" so a
// missed ball visually lands on an abacus rod rather than plain ground.
export default function AbacusFloor() {
  return (
    <View style={styles.container}>
      <View style={styles.knob} />
      <View style={styles.rod} />
      <View style={styles.knob} />
    </View>
  );
}

export const FLOOR_HEIGHT = 26;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: FLOOR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  rod: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.rod,
    borderTopColor: COLORS.rodDark,
    borderTopWidth: 2,
    borderRadius: 7,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.rodDark,
  },
});
