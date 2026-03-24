import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────
interface LoginScreenProps {
  onLogin?: (name: string, code: string) => void;
  onForgotCode?: () => void;
  onJoinNow?: () => void;
}

// ─── Component ───────────────────────────────────────────
export default function LoginScreen({
  onLogin,
  onForgotCode,
  onJoinNow,
}: LoginScreenProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const handleLogin = () => {
    if (onLogin) onLogin(name, code);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Title ── */}
          <Text style={styles.title}>Tactile Explorer</Text>
          <Text style={styles.subtitle}>Your Math Adventure Awaits!</Text>

          {/* ── Avatar ── */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🧒</Text>
            </View>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.card}>
            {/* Explorer Name */}
            <Text style={styles.inputLabel}>Explorer Name</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SuperKid123"
                placeholderTextColor="#AABDD4"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
              />
            </View>

            {/* Secret Code */}
            <Text style={styles.inputLabel}>Secret Code</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#AABDD4"
                value={code}
                onChangeText={setCode}
                secureTextEntry={!showCode}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCode(prev => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showCode ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Let's Go Button */}
            <TouchableOpacity
              style={[
                styles.loginBtn,
                (!name || !code) && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={!name || !code}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Let's Go!</Text>
            </TouchableOpacity>

            {/* Forgot Code */}
            <TouchableOpacity onPress={onForgotCode} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Code?</Text>
            </TouchableOpacity>

            {/* Join Now */}
            {/* <View style={styles.joinRow}>
              <Text style={styles.joinPrompt}>New here? </Text>
              <TouchableOpacity
                onPress={onJoinNow}
                style={styles.joinNowBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.joinNowText}>Join Now</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },

  // Title
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A2259',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#5A6AA8',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Avatar
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

  // Card
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

  // Input
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
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A2259',
    fontWeight: '500',
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Login Button
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

  // Forgot / Join
  forgotBtn: {
    alignItems: 'center',
    marginTop: 18,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A6CF7',
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  joinPrompt: {
    fontSize: 14,
    color: '#8A96B8',
    fontWeight: '500',
  },
  joinNowBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  joinNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2259',
  },

  // Bottom dots
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
