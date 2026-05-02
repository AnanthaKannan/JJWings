import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminHeader({ header }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Text style={styles.brandName}>{header}</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.profileCircle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FB',
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E0',
  },
});
