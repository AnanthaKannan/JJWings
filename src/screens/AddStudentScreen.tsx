import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  addStudentResponse,
  useAddStudentMutation,
  useUpdateStudentMutation,
} from '../store/api';
import { AdminHeader, LoadingOverlay } from '../component';
import ReuseModal, { ReuseModalProps } from '../component/ReuseModal';
import { AddStudentScreenStyles as styles } from './styles/AddStudentScreen.styles';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Main Screen ──────────────────────────────────────────────────────────────

const modalInitial: ReuseModalProps = {
  state: 'success',
  visible: false,
  title: '',
  description: '',
};

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
  const [modal, setModal] = useState<ReuseModalProps>(modalInitial);

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
    let addStudentRes: addStudentResponse;
    let description = '';
    try {
      if (isEditMode && editStudentId) {
        await updateStudent({
          studentId: editStudentId,
          name: fullName.trim(),
          level,
        }).unwrap();
        description = `*${fullName}* has been updated successfully.`;
      } else {
        addStudentRes = await addStudent({
          name: fullName.trim(),
          level,
        }).unwrap();
        description = `*${fullName}* has been registered successfully. The password is : *${addStudentRes.student.password}*`;
      }

      setModal({
        state: 'success',
        visible: true,
        title: isEditMode ? 'Student Updated' : 'Student Added',
        description,
      });
    } catch (err) {
      console.log(err);

      setModal({
        state: 'failure',
        visible: true,
        title: 'Error',
        description: `Failed to ${
          isEditMode ? 'update' : 'add'
        } student. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <AdminHeader
        header={isEditMode ? 'Update Student' : 'Add Student'}
        headerBackgroundColor={'#EEF0F8'}
      />

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
      <ReuseModal
        visible={modal.visible}
        state={modal.state}
        title={modal.title}
        description={modal.description}
        onCancel={() => {
          setModal(modalInitial);
          setFullName('');
          setLevel(0);
          navigation.navigate('AdminStudents', {
            screen: 'StudentDirectory',
          });
        }}
      />
      <LoadingOverlay visible={isSubmitting} label="Adding student..." />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
