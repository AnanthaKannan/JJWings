import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  summaryRow: {
    marginHorizontal: 16,
    marginBottom: 14,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: '#1A202C',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A0AEC0',
    letterSpacing: 0.8,
  },
  teacherHeader: {
    flex: 1,
  },
  actionsHeader: {
    width: 116,
    textAlign: 'right',
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  deletedRow: {
    opacity: 0.58,
  },
  teacherInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletedAvatar: {
    backgroundColor: '#E2E8F0',
  },
  avatarText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '900',
  },
  deletedAvatarText: {
    color: '#64748B',
  },
  nameBlock: {
    flex: 1,
  },
  teacherName: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '900',
  },
  teacherMeta: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  deletedText: {
    color: '#64748B',
  },
  deletedLabel: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
  },
  actions: {
    width: 116,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButton: {
    backgroundColor: '#FEF2F2',
  },
  revertButton: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  revertButtonText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  separator: {
    height: 1,
    backgroundColor: '#F7F7FA',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 42,
    gap: 8,
  },
  emptyText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  formModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
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
  label: {
    color: '#2D3748',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#F0F2FA',
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '600',
  },
  inputFilled: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F6FF',
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 24,
    marginTop: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  restrictedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  restrictedTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
  },
  restrictedText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 32,
  },
});
