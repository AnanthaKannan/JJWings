import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import { AdminHeader, LoadingOverlay, StudentHeader } from '../component';
import {
  useUpdateAdminPasswordMutation,
  useUpdateStudentPasswordMutation,
} from '../store/api';
import { RootState } from '../store/store';

export default function UpdatePasswordScreen() {
  const navigation = useNavigation<any>();
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [updateStudentPassword, studentResult] =
    useUpdateStudentPasswordMutation();
  const [updateAdminPassword, adminResult] = useUpdateAdminPasswordMutation();

  const isBusy = studentResult.isLoading || adminResult.isLoading;

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return 'Password is required.';
    }

    if (value.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    return '';
  };

  const handleSubmit = async () => {
    const oldValidation = oldPassword.trim() ? '' : 'Old password is required.';
    const passwordValidation = validatePassword(password);
    const confirmValidation =
      confirmPassword.trim() !== password.trim()
        ? 'Passwords do not match.'
        : '';

    setOldPasswordError(oldValidation);
    setPasswordError(passwordValidation);
    setConfirmPasswordError(confirmValidation);

    if (oldValidation || passwordValidation || confirmValidation) {
      return;
    }

    try {
      if (isAdmin) {
        await updateAdminPassword({ oldPassword, password }).unwrap();
      } else {
        await updateStudentPassword({ oldPassword, password }).unwrap();
      }

      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      setOldPasswordError('');
      setPasswordError('');
      setConfirmPasswordError('');

      Alert.alert(
        'Password updated',
        'Your password has been updated successfully.',
      );
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update password', error);

      const message =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;

      const friendlyMessage =
        message && typeof message === 'string' && message.length > 0
          ? message
          : 'Unable to update your password right now. Please try again.';

      Alert.alert('Update failed', friendlyMessage);
    }
  };

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    error: string,
    showPasswordState: boolean,
    toggleShowPassword: () => void,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => {
            onChangeText(text);
            if (error) {
              if (label === 'New Password') {
                setPasswordError(validatePassword(text));
              } else {
                setConfirmPasswordError(
                  text.trim() !== password.trim()
                    ? 'Passwords do not match.'
                    : '',
                );
              }
            }
          }}
          secureTextEntry={!showPasswordState}
          placeholder={label}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={toggleShowPassword} activeOpacity={0.75}>
          <MaterialIcons
            name={showPasswordState ? 'visibility-off' : 'visibility'}
            size={22}
            color="#64748B"
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={isAdmin ? '#EEF0F8' : '#EEF2FF'}
      />
      {isAdmin ? (
        <AdminHeader
          header="Update Password"
          showBackButton
          headerBackgroundColor="#EEF0F8"
        />
      ) : (
        <StudentHeader
          header="Update Password"
          showBackButton
          headerBackgroundColor="#EEF2FF"
        />
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="lock-reset" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.cardTitle}>Change Password</Text>
            <Text style={styles.cardSubtitle}>
              Use a strong password you will remember.
            </Text>

            {renderPasswordField(
              'Old Password',
              oldPassword,
              setOldPassword,
              oldPasswordError,
              showOldPassword,
              () => setShowOldPassword(prev => !prev),
            )}

            {renderPasswordField(
              'New Password',
              password,
              setPassword,
              passwordError,
              showPassword,
              () => setShowPassword(prev => !prev),
            )}

            {renderPasswordField(
              'Confirm Password',
              confirmPassword,
              setConfirmPassword,
              confirmPasswordError,
              showConfirmPassword,
              () => setShowConfirmPassword(prev => !prev),
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isBusy}
              activeOpacity={0.88}
            >
              <Text style={styles.submitButtonText}>
                {isBusy ? 'Updating...' : 'Update Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isBusy} label="Updating password..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
