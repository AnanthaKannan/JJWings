import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { clearSavedLoginCredentials, getDeviceId } from '../util/authStorage';
import { logout } from '../store/slices';
import { RootState } from '../store/store';
import { useDeleteStudentDeviceIdMutation } from '../store/api';
import { ProfileScreenStyles as styles } from './styles/ProfileScreen.styles';

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
        const deviceId = await getDeviceId();
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
      <View style={styles.content}>
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
      </View>
    </SafeAreaView>
  );
}
