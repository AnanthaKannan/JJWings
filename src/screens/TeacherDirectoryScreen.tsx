import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import {
  AdminHeader,
  FloatingAddButton,
  LoadingOverlay,
  LoadingState,
} from '../component';
import {
  addAdminResponse,
  Admin,
  useAddTeacherMutation,
  useGetTeachersQuery,
  useUpdateTeacherMutation,
} from '../store/api';
import { RootState } from '../store/store';
import ReuseModal, { ReuseModalProps } from '../component/ReuseModal';
import { TeacherDirectoryScreenStyles as styles } from './styles/TeacherDirectoryScreen.styles';

const TeacherSeparator = () => <View style={styles.separator} />;

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

type TeacherRowProps = {
  teacher: Admin;
  onEdit: () => void;
  onDelete: () => void;
  onRevert: () => void;
};

function TeacherRow({ teacher, onEdit, onDelete, onRevert }: TeacherRowProps) {
  return (
    <View style={[styles.row, teacher.isDeleted && styles.deletedRow]}>
      <View style={styles.teacherInfo}>
        <View
          style={[styles.avatar, teacher.isDeleted && styles.deletedAvatar]}
        >
          <Text
            style={[
              styles.avatarText,
              teacher.isDeleted && styles.deletedAvatarText,
            ]}
          >
            {getInitials(teacher.name) || 'T'}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text
            style={[
              styles.teacherName,
              teacher.isDeleted && styles.deletedText,
            ]}
            numberOfLines={1}
          >
            {teacher.name || 'Teacher'}
          </Text>
          <Text style={styles.teacherMeta} numberOfLines={1}>
            #{teacher.adminId ?? teacher.id}
          </Text>
          {teacher.isDeleted && (
            <Text style={styles.deletedLabel}>Pending delete</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {teacher.isDeleted ? (
          <TouchableOpacity
            style={styles.revertButton}
            onPress={onRevert}
            activeOpacity={0.82}
          >
            <MaterialIcons name="restore" size={16} color="#047857" />
            <Text style={styles.revertButtonText}>Revert</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onEdit}
              activeOpacity={0.82}
            >
              <MaterialIcons name="edit" size={18} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.deleteIconButton]}
              onPress={onDelete}
              activeOpacity={0.82}
            >
              <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const modalInitial: ReuseModalProps = {
  state: 'confirm',
  visible: false,
  title: '',
  description: '',
};

export default function TeacherDirectoryScreen() {
  const [teacherName, setTeacherName] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Admin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<ReuseModalProps>(modalInitial);

  const adminRoles = useSelector((state: RootState) => state.common.adminRoles);
  const canManageTeachers = adminRoles.includes('superadmin');

  const {
    data: { admins = [] } = {},
    isLoading,
    refetch,
  } = useGetTeachersQuery(undefined, {
    skip: !canManageTeachers,
  });
  const [addTeacher, { isLoading: isAddingTeacher }] = useAddTeacherMutation();
  const [updateTeacher, { isLoading: isUpdatingTeacher }] =
    useUpdateTeacherMutation();

  const sortedTeachers = useMemo(
    () =>
      [...admins].sort((left, right) => {
        if (left.isDeleted !== right.isDeleted) {
          return left.isDeleted ? 1 : -1;
        }

        return left.name.localeCompare(right.name);
      }),
    [admins],
  );
  const isSubmitting = isAddingTeacher || isUpdatingTeacher;
  const isEditMode = editingTeacher !== null;
  const isFormValid = teacherName.trim().length > 0;

  const openCreateModal = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Admin) => {
    setEditingTeacher(teacher);
    setTeacherName(teacher.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setEditingTeacher(null);
    setTeacherName('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    const cleanName = teacherName.trim();
    if (!cleanName) return;

    try {
      let password = '';
      if (editingTeacher) {
        await updateTeacher({
          teacherId: editingTeacher.id,
          name: cleanName,
        }).unwrap();
      } else {
        const teacherRes: addAdminResponse = await addTeacher({
          name: cleanName,
        }).unwrap();
        password = teacherRes?.data?.password;
      }

      closeModal();
      setModal({
        visible: true,
        state: 'success',
        title: isEditMode ? 'Teacher Updated' : 'Teacher Created',
        description: `${cleanName} has been ${
          isEditMode ? 'updated' : 'created'
        } successfully. ${isEditMode ? '' : 'The password is '} ${
          isEditMode ? '' : `*${password}*`
        }`,
      });
    } catch (error) {
      console.error('Failed to save teacher:', error);
      setModal({
        visible: true,
        state: 'failure',
        title: 'Error',
        description: `Failed to ${
          isEditMode ? 'update' : 'create'
        } teacher. Please try again.`,
      });
    }
  };

  const deleteTeacher = async (teacher: Admin) => {
    try {
      await updateTeacher({
        teacherId: teacher.id,
        isDeleted: true,
      }).unwrap();

      setModal({
        visible: true,
        state: 'success',
        title: 'Teacher Deleted',
        description: 'Teacher deletion is pending.',
      });
    } catch (error) {
      setModal({
        visible: true,
        state: 'failure',
        title: 'Error',
        description: 'Failed to delete teacher. Please try again.',
      });
      console.error('Failed to delete teacher:', error);
    }
  };

  const confirmDelete = (teacher: Admin) => {
    setModal({
      visible: true,
      onConfirm: () => deleteTeacher(teacher),
      state: 'confirm',
      title: 'Confirm Teacher Delete',
      description: `This will take *2 days* to delete. If you delete *${teacher.name}*, the students under this teacher will also be deleted. Do you want to continue?`,
    });
  };

  const revertDelete = async (teacher: Admin) => {
    try {
      await updateTeacher({
        teacherId: teacher.id,
        isDeleted: false,
      }).unwrap();
      setModal({
        visible: true,
        state: 'success',
        title: 'Teacher Restored',
        description: `Teacher has been restored.`,
      });
    } catch (error) {
      console.error('Failed to restore teacher:', error);
      setModal({
        visible: true,
        state: 'failure',
        title: 'Error',
        description: 'Failed to restore teacher. Please try again.',
      });
    }
  };

  const confirmRevert = (teacher: Admin) => {
    setModal({
      visible: true,
      onConfirm: () => revertDelete(teacher),
      state: 'confirm',
      title: 'Revert Teacher Delete',
      description: `Do you want to restore *${teacher.name}*? This will cancel the pending delete request.`,
    });
  };

  if (!canManageTeachers) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
        <AdminHeader header="Teachers" />
        <View style={styles.restrictedState}>
          <MaterialIcons name="lock" size={32} color="#94A3B8" />
          <Text style={styles.restrictedTitle}>Admin access required</Text>
          <Text style={styles.restrictedText}>
            This option is only available for admins.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <AdminHeader header="Teachers" />

      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryTitle}>Teacher Directory</Text>
          <Text style={styles.summaryMeta}>{admins.length} total</Text>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.teacherHeader]}>TEACHER</Text>
          <Text style={[styles.headerText, styles.actionsHeader]}>ACTIONS</Text>
        </View>
        {isLoading && <LoadingState label="Loading teachers..." />}
        <FlatList
          data={isLoading ? [] : sortedTeachers}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
              progressBackgroundColor="#EEF2FF"
            />
          }
          renderItem={({ item }) => (
            <TeacherRow
              teacher={item}
              onEdit={() => openEditModal(item)}
              onDelete={() => confirmDelete(item)}
              onRevert={() => confirmRevert(item)}
            />
          )}
          ItemSeparatorComponent={TeacherSeparator}
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.emptyState}>
                <MaterialIcons name="school" size={34} color="#CBD5E1" />
                <Text style={styles.emptyText}>No teachers found</Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
      <FloatingAddButton onPress={openCreateModal} />

      <ReuseModal
        visible={modal.visible}
        state={modal.state}
        title={modal.title}
        description={modal.description}
        onConfirm={modal.onConfirm}
        onCancel={() => {
          setModal(modalInitial);
        }}
      />
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable style={styles.formModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Update Teacher' : 'Add Teacher'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
                disabled={isSubmitting}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Teacher Name</Text>
            <TextInput
              style={[
                styles.input,
                teacherName.length > 0 && styles.inputFilled,
              ]}
              placeholder="Enter teacher name"
              placeholderTextColor="#A0AEC0"
              value={teacherName}
              onChangeText={setTeacherName}
              autoCapitalize="words"
              returnKeyType="done"
              editable={!isSubmitting}
              onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.86}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                  ? 'Update'
                  : 'Submit'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity> */}

      <LoadingOverlay
        visible={isSubmitting}
        label={isEditMode ? 'Updating teacher...' : 'Creating teacher...'}
      />
    </SafeAreaView>
  );
}
