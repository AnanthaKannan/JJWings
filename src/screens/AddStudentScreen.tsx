import React, { useEffect, useState } from 'react';
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
  Modal,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAddStudentMutation, useUpdateStudentMutation } from '../store/api';
import { AdminHeader, LoadingOverlay } from '../component';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddStudentScreen() {
  const route = useRoute<any>();
  const editStudentId = route.params?.studentId as string | undefined;
  const editStudentName = route.params?.studentName as string | undefined;
  const editStudentLevel =
    typeof route.params?.level === 'number' ? route.params.level : 0;
  const isEditMode = Boolean(editStudentId);
  const [fullName, setFullName] = useState(editStudentName ?? '');
  const [level, setLevel] = useState(editStudentLevel);
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = fullName.trim().length > 0;
  const navigation = useNavigation<any>();

  const [addStudent] = useAddStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();

  useEffect(() => {
    setFullName(editStudentName ?? '');
    setLevel(editStudentLevel);
  }, [editStudentLevel, editStudentName]);

  const handleAddStudent = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editStudentId) {
        await updateStudent({
          studentId: editStudentId,
          name: fullName.trim(),
          level,
        }).unwrap();
      } else {
        await addStudent({
          name: fullName.trim(),
          level,
        }).unwrap();
      }

      Alert.alert(
        isEditMode ? 'Student Updated' : 'Student Added',
        `${fullName} has been ${
          isEditMode ? 'updated' : 'registered'
        } successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setFullName('');
              setLevel(0);
              navigation.navigate('AdminStudents', {
                screen: 'StudentDirectory',
              });
            },
          },
        ],
      );
    } catch (err) {
      console.log(err);
      Alert.alert(
        'Error',
        `Failed to ${isEditMode ? 'update' : 'add'} student. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <AdminHeader header={isEditMode ? 'Update Student' : 'Add Student'} />

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
              {isEditMode
                ? 'Update the student details and save the changes.'
                : 'Enter the administrative details to register a new student to the portal.'}
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
                returnKeyType="done"
                onSubmitEditing={handleAddStudent}
              />
            </View>

            {/* Level */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Level</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsLevelPickerOpen(true)}
                activeOpacity={0.82}
              >
                <Text style={styles.dropdownValue}>Level {level}</Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={22}
                  color="#4F46E5"
                />
              </TouchableOpacity>
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
                {isSubmitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Adding...'
                  : isEditMode
                  ? 'Update Student'
                  : 'Add Student'}
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
      <Modal
        visible={isLevelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLevelPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsLevelPickerOpen(false)}
        >
          <Pressable style={styles.levelModal}>
            <View style={styles.levelModalHeader}>
              <Text style={styles.levelModalTitle}>Select Level</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsLevelPickerOpen(false)}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>
            <View style={styles.levelGrid}>
              {Array.from({ length: 11 }, (_, value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.levelOption,
                    level === value && styles.levelOptionActive,
                  ]}
                  onPress={() => {
                    setLevel(value);
                    setIsLevelPickerOpen(false);
                  }}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      level === value && styles.levelOptionTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <LoadingOverlay visible={isSubmitting} label="Adding student..." />
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
  dropdownButton: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F5F6FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  levelModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  levelModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelModalTitle: {
    color: '#1A202C',
    fontSize: 17,
    fontWeight: '900',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelOption: {
    width: 48,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  levelOptionText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '900',
  },
  levelOptionTextActive: {
    color: '#FFFFFF',
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
