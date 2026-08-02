import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import { getFileUrl } from '../util/fileUrl';

export const Avatar = ({
  color,
  name,
  profilePic,
}: {
  color: string;
  name: string;
  profilePic?: string;
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  const profilePicUrl = getFileUrl(profilePic);

  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      {profilePicUrl ? (
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
