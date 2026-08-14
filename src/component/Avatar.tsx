import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { getFileUrl } from '../util/fileUrl';

export const Avatar = ({
  color = '#8db4e8',
  name,
  profilePic,
  icon,
  size = 42,
}: {
  color?: string;
  name: string;
  icon?: string;
  profilePic?: string | null;
  size?: number;
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  const profilePicUrl = getFileUrl(profilePic);

  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      {icon ? (
        <MaterialIcons
          name="groups"
          size={Math.round(size * 0.52)}
          color="#2563EB"
        />
      ) : profilePicUrl ? (
        <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default Avatar;
