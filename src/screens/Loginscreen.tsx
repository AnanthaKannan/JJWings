import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import bannerImage from '../../assets/images/banner.png';
import color from '../util/colors';
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

          <TouchableOpacity
            style={styles.createAcademyLink}
            onPress={() => navigation.navigate('CreateAcademy')}
            activeOpacity={0.7}
          >
            <Text style={styles.createAcademyLinkText}>
              Running a coaching center?{'  '}
              <Text style={styles.createAcademyLinkTextBold}>
                Create your Academy
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 32,
  },
  splashImage: {
    width: '100%',
    height: 120,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  scrollKeyboardOpen: {
    justifyContent: 'flex-start',
  },
  bannerImage: {
    width: '90%',
    height: 60,
    marginBottom: 30,
  },
  avatarWrapper: {
    marginBottom: -28,
    zIndex: 10,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5C97A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#D4A044',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarText: {
    color: '#1A2259',
    fontSize: 22,
    fontWeight: '900',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 28,
    shadowColor: '#B0BADF',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2259',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: {
    minWidth: 24,
    fontSize: 12,
    fontWeight: '900',
    color: '#5A6AA8',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A2259',
    fontWeight: '500',
  },
  eyeIcon: {
    minWidth: 38,
    fontSize: 13,
    color: '#1A3A6B',
    fontWeight: '800',
    textAlign: 'right',
  },
  loginBtn: {
    backgroundColor: '#1A3A6B',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#1A3A6B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  loginBtnDisabled: {
    backgroundColor: '#A0AECC',
    shadowOpacity: 0.1,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forgotText: {
    fontSize: 14,
    color: color.RED,
    textAlign: 'center',
    marginTop: 10,
  },
  // add to LoginScreen's StyleSheet
  createAcademyLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  createAcademyLinkText: {
    fontSize: 13,
    color: '#6B7280',
  },
  createAcademyLinkTextBold: {
    color: '#4C5FE8',
    fontWeight: '700',
  },
  createAcademyLinkSubtext: {
    fontSize: 12,
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 4,
  },
});
