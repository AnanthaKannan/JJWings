import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type FloatingAddButtonProps = {
  onPress?: () => void;
  icon?: string;
  hasBottomBar?: boolean;
};

export default function FloatingAddButton({
  onPress = () => {},
  icon = 'add',
  hasBottomBar = true,
}: FloatingAddButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: hasBottomBar ? 18 : 70 }]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <MaterialIcons name={icon} size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    zIndex: 10,
    elevation: 8,
  },
});
