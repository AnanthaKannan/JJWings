import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../store/store';

type AnimatedTabIconProps = {
  name: string;
  color: string;
  size: number;
  focused: boolean;
};

type NotificationTabIconProps = {
  color: string;
  size: number;
  focused?: boolean;
};

export function AnimatedTabIcon({
  name,
  color,
  size,
  focused,
}: AnimatedTabIconProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      friction: 4,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-7deg'],
  });

  return (
    <Animated.View
      style={{ transform: [{ translateY }, { scale }, { rotate }] }}
    >
      <MaterialIcons name={name} color={color} size={size} />
    </Animated.View>
  );
}

export function NotificationTabIcon({
  color,
  size,
  focused = false,
}: NotificationTabIconProps) {
  const hasNotificationAttention = useSelector(
    (state: RootState) => state.common.hasNotificationAttention,
  );
  const ring = useRef(new Animated.Value(0)).current;
  const shouldRing = hasNotificationAttention && !focused;

  useEffect(() => {
    if (!shouldRing) {
      ring.stopAnimation();
      ring.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: -1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0.7,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [ring, shouldRing]);

  const rotate = ring.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-16deg', '16deg'],
  });

  return (
    <View>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <MaterialIcons name="notifications" color={color} size={size} />
      </Animated.View>
      {shouldRing && <View style={styles.notificationAttentionDot} />}
    </View>
  );
}

export function MessageTabIcon({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  const unreadCount = useSelector(
    (state: RootState) => state.common.messageUnreadCount,
  );
  const displayCount = unreadCount > 99 ? '99+' : `${unreadCount}`;

  return (
    <View>
      <MaterialIcons name="mail" color={color} size={size} />
      {unreadCount > 0 ? (
        <View style={styles.messageUnreadBadge}>
          <Text style={styles.messageUnreadBadgeText}>{displayCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notificationAttentionDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  messageUnreadBadge: {
    position: 'absolute',
    top: -7,
    right: -11,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  messageUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
});
