import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../store/store';

type AdminHeaderProps = {
  header: string;
  showBackButton?: boolean;
};

export default function AdminHeader({
  header,
  showBackButton,
}: AdminHeaderProps) {
  const navigation = useNavigation<any>();
  const adminName = useSelector((state: RootState) => state.common.adminName);
  const adminInitial = (adminName.trim()[0] ?? 'A').toUpperCase();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          if (showBackButton) navigation.goBack();
        }}
        style={styles.leftArea}
        disabled={!showBackButton}
        activeOpacity={0.75}
      >
        {showBackButton && (
          <MaterialIcons name="arrow-back" size={22} color="#1A202C" />
        )}
        <Text style={styles.brandName} numberOfLines={1}>
          {header}
        </Text>
      </TouchableOpacity>

      <View style={styles.headerRight}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitial}>{adminInitial}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FB',
  },
  leftArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  brandName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
});
