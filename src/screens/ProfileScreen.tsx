import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';

import { clearSavedLoginCredentials } from '../util/authStorage';
import { logout } from '../store/slices';
import { RootState } from '../store/store';
import { useDeleteStudentDeviceIdMutation } from '../store/api';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const [deleteStudentDeviceId] = useDeleteStudentDeviceIdMutation();
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -10,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float, opacity, scale, sparkle]);

  const handleCancel = () => {
    navigation.navigate(isAdmin ? 'AdminStudents' : 'Progress');
  };

  const handleLogout = async () => {
    if (!isAdmin && studentId) {
      try {
        const deviceId = await DeviceInfo.getUniqueId();
        console.log('studentId', studentId, 'deviceId', deviceId);
        await deleteStudentDeviceId({ studentId, deviceId }).unwrap();
      } catch (error) {
        console.error('Failed to remove student device id', error);
      }
    }

    await clearSavedLoginCredentials();
    dispatch(logout());
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  };

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.25],
  });
  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backgroundCircleOne} />
      <View style={styles.backgroundCircleTwo} />

      <Animated.View
        style={[
          styles.card,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrap,
            {
              transform: [{ translateY: float }],
            },
          ]}
        >
          <MaterialIcons name="rocket-launch" size={58} color="#FFFFFF" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sparkleOne,
            {
              opacity: sparkleOpacity,
              transform: [{ scale: sparkleScale }],
            },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={22} color="#FBBF24" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sparkleTwo,
            {
              opacity: sparkleOpacity,
              transform: [{ scale: sparkleScale }],
            },
          ]}
        >
          <MaterialIcons name="stars" size={24} color="#38BDF8" />
        </Animated.View>

        <Text style={styles.title}>Ready to fly away?</Text>
        <Text style={styles.subtitle}>
          Your progress is saved. Come back anytime for the next challenge.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogout}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryText}>Yes, Logout</Text>
          <MaterialIcons name="logout" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancel}
          activeOpacity={0.82}
        >
          <Text style={styles.secondaryText}>Keep Playing</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
    padding: 22,
    overflow: 'hidden',
  },
  backgroundCircleOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#DBEAFE',
    top: -80,
    right: -80,
  },
  backgroundCircleTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#CFFAFE',
    bottom: -70,
    left: -60,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 24,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  sparkleOne: {
    position: 'absolute',
    top: 28,
    right: 62,
  },
  sparkleTwo: {
    position: 'absolute',
    top: 92,
    left: 52,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '900',
  },
});
