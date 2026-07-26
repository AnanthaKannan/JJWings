import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import bannerImage from '../../assets/images/banner.png';
import { useLazyGetLoginQuery } from '../store/api';
import {
  setAdminCredentials,
  setStudentCredentials,
  setMockDeviceId,
  setModal,
  resetModal,
} from '../store/slices';
import {
  clearSavedLoginCredentials,
  getSavedLoginCredentials,
  saveLoginCredentials,
  getDeviceId,
} from '../util/authStorage';
import { RootState } from '../store/store';
import { LoginscreenStyles as styles } from './styles/Loginscreen.styles';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [checkingSavedLogin, setCheckingSavedLogin] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [login, loginRes] = useLazyGetLoginQuery();
  const navigation = useNavigation<any>();
  const modal = useSelector((state: RootState) => state.common.modal);
  const dispatch = useDispatch();

  const finishLogin = async (
    studentId: string,
    password: string,
    shouldSave: boolean,
  ) => {
    const cleanStudentId = studentId.trim();
    const deviceId = await getDeviceId();

    const result = await login({
      username: cleanStudentId,
      password,
      deviceId,
    });

    const errorStatus = result?.error?.status; // can be number or string
    const isSuccess = result?.isSuccess;

    if (errorStatus === 401 || errorStatus === 403) {
      return false;
    } else if (isSuccess === false && errorStatus !== 200) {
      dispatch(
        setModal({
          state: 'failure',
          visible: true,
          title: 'Network Error',
          description:
            errorStatus === 'FETCH_ERROR'
              ? 'Please check your internet connection.'
              : 'Please try again...',
          closeLabel: 'Try Again',
          onCancel: () => {
            trySavedLogin();
            dispatch(resetModal());
          },
        }),
      );
      return true;
    }

    if ('data' in result && result.data) {
      if (shouldSave) {
        await saveLoginCredentials({ studentId: cleanStudentId, password });
      }

      if (result.data.role === 'student') {
        dispatch(
          setStudentCredentials({
            studentId: result.data.id,
            studentCode: result.data.studentCode,
            vertical: result.data.vertical,
            isStudent: true,
            studentName: result.data.name,
            studentLevel: result.data.level,
            studentProfilePic: result.data.profilePicPath,
            token: result.data.token,
          }),
        );
      } else {
        dispatch(
          setAdminCredentials({
            adminId: result.data.id,
            adminCode: result.data.adminCode,
            isAdmin: true,
            adminName: result.data.name,
            adminProfilePic: result.data.profilePicPath,
            adminOrgId: result.data.orgId,
            adminRoles: result.data.roles,
            token: result.data.token,
          }),
        );
      }
      navigation.reset({
        index: 0,
        routes: [{ name: result.data.role === 'student' ? 'Main' : 'Admin' }],
      });
      return true;
    }

    return false;
  };

  useEffect(() => {
    getDeviceId().then(mockDeviceId => {
      dispatch(setMockDeviceId({ mockDeviceId }));
    });
  }, [dispatch]);

  const trySavedLogin = async () => {
    setCheckingSavedLogin(true);
    try {
      const savedCredentials = await getSavedLoginCredentials();
      if (!savedCredentials) {
        return;
      }

      const loggedIn = await finishLogin(
        savedCredentials.studentId,
        savedCredentials.password,
        false,
      );

      if (!loggedIn) {
        await clearSavedLoginCredentials();
      }
    } finally {
      setCheckingSavedLogin(false);
    }
  };

  useEffect(() => {
    trySavedLogin();
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    const loggedIn = await finishLogin(name, code, true);

    if (!loggedIn) {
      await clearSavedLoginCredentials();
    }
  };

  if (checkingSavedLogin || modal?.visible) {
    return (
      <SafeAreaView style={styles.splashArea}>
        <Image
          source={bannerImage}
          style={styles.splashImage}
          resizeMode="contain"
        />
        <ActivityIndicator color="#1A3A6B" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scroll,
            keyboardVisible && styles.scrollKeyboardOpen,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={bannerImage}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {/* <Text style={styles.avatarText}>JJ</Text> */}
              <Text style={styles.avatarEmoji}>🧒</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>Explorer ID</Text>
            <View style={styles.inputWrapper}>
              {/* <Text style={styles.inputIcon}>ID</Text> */}
              <TextInput
                style={styles.input}
                placeholder="e.g. JJ099"
                placeholderTextColor="#AABDD4"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>Secret Code</Text>
            <View style={styles.inputWrapper}>
              {/* <Text style={styles.inputIcon}>PW</Text> */}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#AABDD4"
                value={code}
                onChangeText={setCode}
                secureTextEntry={!showCode}
                autoCapitalize="none"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 250);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowCode(prev => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showCode ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginBtn,
                (!name || !code || loginRes?.isLoading) &&
                  styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={!name || !code || loginRes?.isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>
                {loginRes?.isLoading ? 'Loading...' : "Let's Go!"}
              </Text>
            </TouchableOpacity>

            {loginRes?.isError && (
              <Text style={styles.forgotText}>
                User Name or password incorrect.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
