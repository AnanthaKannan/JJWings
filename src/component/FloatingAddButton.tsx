import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type FloatingAddButtonProps = {
  onPress?: () => void;
};

export default function FloatingAddButton({
  onPress = () => {},
}: FloatingAddButtonProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.86}>
      <MaterialIcons name="add" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
