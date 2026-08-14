import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { AdminHeader, LoadingOverlay, LoadingState } from '../component';
import {
  Student,
  useCreateMessageGroupMutation,
  useGetStudentsQuery,
  useUpdateMessageGroupMutation,
} from '../store/api';
import { Group } from '../types';

const getGroupStudentIds = (group?: Group) => {
  if (!group) return [];
  if (group.studentIds?.length) return group.studentIds;

  return (
    group.students
      ?.map(student => {
        if (typeof student === 'string') return student;
        return student._id ?? student.id;
      })
      .filter((id): id is string => Boolean(id)) ?? []
  );
};

type StudentRowProps = {
  student: Student;
  selected: boolean;
  onToggle: () => void;
};

function StudentRow({ student, selected, onToggle }: StudentRowProps) {
  return (
    <TouchableOpacity
      style={[styles.studentRow, selected && styles.studentRowSelected]}
      onPress={onToggle}
      activeOpacity={0.78}
    >
      <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
        {selected ? (
          <MaterialIcons name="check" size={16} color="#FFFFFF" />
        ) : null}
      </View>
      <View style={styles.studentBody}>
        <Text style={styles.studentName} numberOfLines={1}>
          {student.name || 'Student'}
        </Text>
        <Text style={styles.studentMeta} numberOfLines={1}>
          {student.studentId ?? `Level ${student.level ?? '-'}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CreateMessageGroupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingGroup = route.params?.group as Group | undefined;
  const isEditMode = Boolean(editingGroup?._id);

  const [groupName, setGroupName] = useState(editingGroup?.groupName ?? '');
  const [searchText, setSearchText] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    getGroupStudentIds(editingGroup),
  );
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: { students = [] } = {},
    isLoading,
    refetch,
  } = useGetStudentsQuery({ limit: 500 });
  const [createMessageGroup, { isLoading: isCreating }] =
    useCreateMessageGroupMutation();
  const [updateMessageGroup, { isLoading: isUpdating }] =
    useUpdateMessageGroupMutation();

  const filteredStudents = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return students;

    return students.filter(student => {
      const name = student.name.toLowerCase();
      const code = student.studentId?.toLowerCase() ?? '';
      return name.includes(query) || code.includes(query);
    });
  }, [searchText, students]);

  const isSubmitting = isCreating || isUpdating;
  const selectedCount = selectedStudentIds.length;
  const canSubmit = groupName.trim().length > 0 && selectedCount > 1;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(current =>
      current.includes(studentId)
        ? current.filter(id => id !== studentId)
        : [...current, studentId],
    );
  };

  const handleSubmit = async () => {
    const cleanName = groupName.trim();
    if (!cleanName || selectedCount < 2 || isSubmitting) return;

    try {
      if (editingGroup?._id) {
        await updateMessageGroup({
          groupId: editingGroup._id,
          groupName: cleanName,
          studentIds: selectedStudentIds,
        }).unwrap();
      } else {
        await createMessageGroup({
          groupName: cleanName,
          studentIds: selectedStudentIds,
        }).unwrap();
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save group:', error);
      Alert.alert(
        isEditMode ? 'Group not updated' : 'Group not created',
        'Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <AdminHeader
        header={isEditMode ? 'Update Group' : 'Create Group'}
        showBackButton
      />

      <View style={styles.content}>
        <View style={styles.formBand}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={[styles.input, groupName.length > 0 && styles.inputFilled]}
            placeholder="Enter group name"
            placeholderTextColor="#94A3B8"
            value={groupName}
            onChangeText={setGroupName}
            editable={!isSubmitting}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <View style={styles.selectionSummary}>
            <Text style={styles.summaryTitle}>Students</Text>
            <Text
              style={[
                styles.summaryCount,
                selectedCount > 1 && styles.summaryCountReady,
              ]}
            >
              {selectedCount} selected
            </Text>
          </View>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students"
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
              editable={!isSubmitting}
            />
          </View>
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.studentList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
          renderItem={({ item }) => (
            <StudentRow
              student={item}
              selected={selectedStudentIds.includes(item.id)}
              onToggle={() => toggleStudent(item.id)}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <LoadingState label="Loading students..." />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="people-outline" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No students found</Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canSubmit || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.86}
          >
            <MaterialIcons
              name={isEditMode ? 'save' : 'group-add'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.submitText}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update Group'
                : 'Create Group'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <LoadingOverlay
        visible={isSubmitting}
        label={isEditMode ? 'Updating group...' : 'Creating group...'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  formBand: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  label: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  inputFilled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#C7D2FE',
  },
  selectionSummary: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '900',
  },
  summaryCount: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
  },
  summaryCountReady: {
    color: '#047857',
  },
  searchWrap: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  studentList: {
    padding: 14,
    gap: 10,
    paddingBottom: 92,
  },
  studentRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentRowSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F8FAFC',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkCircleActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  studentBody: {
    flex: 1,
  },
  studentName: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  studentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 12,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
