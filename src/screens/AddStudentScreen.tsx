import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useAddStudentMutation, useGetIdGenQuery } from '../store/api';
import { AdminHeader } from '../component';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddStudentScreen() {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = fullName.trim().length > 0 && studentId.trim().length > 0;
  const navigation = useNavigation();

  const [addStudent] = useAddStudentMutation();
  const { data: idGenData, refetch } = useGetIdGenQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  console.log('idGenData', idGenData);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshStudentId = async () => {
        const result = await refetch();
        const studentLastID = result.data?.studentLastID;

        if (isActive && studentLastID) {
          setStudentId(`JW${studentLastID}`);
        }
      };

      refreshStudentId();

      return () => {
        isActive = false;
      };
    }, [refetch]),
  );
  // useEffect(() => {
  //   console.log('eeeeeeeeeeeeeeeeeeeee');
  // }, []);

  useEffect(() => {
    if (idGenData?.studentLastID) {
      setStudentId(`JW${idGenData.studentLastID}`);
    }
  }, [idGenData]);

  console.log('idGenData', idGenData);
  const handleAddStudent = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const studentLastID =
        idGenData?.studentLastID ?? Number(studentId.replace(/\D/g, ''));

      await addStudent({
        studentId,
        name: fullName,
        password: 'Welcome123',
        studentLastID,
      }).unwrap();

      await refetch();

      Alert.alert(
        'Student Added',
        `${fullName} has been registered successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setFullName('');
              navigation.goBack();
            },
          },
        ],
      );
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <AdminHeader header="Add Student" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Student Information</Text>
            <Text style={styles.cardSubtitle}>
              Enter the administrative details to register a new student to the
              portal.
            </Text>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  fullName.length > 0 && styles.inputFilled,
                ]}
                placeholder="Enter student's full name"
                placeholderTextColor="#A0AEC0"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Student ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Student ID</Text>
              <TextInput
                style={[
                  styles.input,
                  studentId.length > 0 && styles.inputFilled,
                ]}
                placeholder="ID-000000"
                disableFullscreenUI
                placeholderTextColor="#A0AEC0"
                value={studentId}
                onChangeText={setStudentId}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleAddStudent}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.addButton,
                (!isFormValid || isSubmitting) && styles.addButtonDisabled,
              ]}
              onPress={handleAddStudent}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.addButtonText}>
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Text>
              {!isSubmitting && (
                <MaterialIcons
                  name="person-add"
                  size={18}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#EEF0F8',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.2,
  },
  searchBtn: {
    padding: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C4B5D6',
    marginLeft: 4,
  },

  // Scroll
  scroll: {
    padding: 16,
    paddingTop: 8,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 19,
    marginBottom: 28,
  },

  // Field
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0F2FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#2D3748',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFilled: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F6FF',
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C3E8C',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: '#2C3E8C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Cancel
  cancelLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
