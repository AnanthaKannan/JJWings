import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { Group } from '../../types';
import { MessageStudent } from '../../store/api';
import Filter from '../Filter';
import FloatingAddButton from '../FloatingAddButton';
import LoadingState from '../LoadingState';
import ListModal, { List } from '../ListModal';
import GroupRow from './GroupRow';
import StudentRow from './StudentRow';

export type MessageType = 'group' | 'individual';

type AdminMessageListProps = {
  selectedFilter: MessageType;
  students: MessageStudent[];
  groups: Group[];
  refreshing: boolean;
  isStudentListLoading: boolean;
  isGroupListLoading: boolean;
  onRefresh: () => void;
  onFilterSelect: (value: MessageType) => void;
  onCreateGroup: () => void;
  onSelectStudent: (student: MessageStudent) => void;
  onSelectGroup: (group: Group) => void;
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (group: Group) => void;
};

const FILTERS: { label: string; value: MessageType }[] = [
  { label: 'Students', value: 'individual' },
  { label: 'Group', value: 'group' },
];

const EMPTY_LIST_MODAL = {
  open: false,
  students: [] as List[],
  title: '',
};

export default function AdminMessageList({
  selectedFilter,
  students,
  groups,
  refreshing,
  isStudentListLoading,
  isGroupListLoading,
  onRefresh,
  onFilterSelect,
  onCreateGroup,
  onSelectStudent,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
}: AdminMessageListProps) {
  const [listModal, setListModal] = useState(EMPTY_LIST_MODAL);

  const handleShowStudents = (group: Group) => {
    setListModal({
      title: group.groupName,
      students: group.studentIds?.map(student => ({
        key: student._id,
        value: student.name,
      })),
      open: true,
    });
  };

  return (
    <View style={styles.studentListPane}>
      <Filter
        filters={FILTERS}
        onSelect={onFilterSelect}
        selected={selectedFilter}
      />
      <ListModal
        visible={listModal.open}
        onClose={() => setListModal(EMPTY_LIST_MODAL)}
        title={listModal.title}
        list={listModal.students}
      />
      <FloatingAddButton onPress={onCreateGroup} />
      {selectedFilter === 'individual' ? (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
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
            <StudentRow student={item} onPress={() => onSelectStudent(item)} />
          )}
          ListEmptyComponent={
            isStudentListLoading ? (
              <LoadingState label="Loading students..." />
            ) : (
              <View style={styles.emptyChat}>
                <MaterialIcons
                  name="people-outline"
                  size={42}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTitle}>No students found</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
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
            <GroupRow
              group={item}
              onPress={() => onSelectGroup(item)}
              onEdit={() => onEditGroup(item)}
              showStudents={() => handleShowStudents(item)}
              onDelete={() => onDeleteGroup(item)}
            />
          )}
          ListEmptyComponent={
            isGroupListLoading ? (
              <LoadingState label="Loading groups..." />
            ) : (
              <View style={styles.emptyChat}>
                <MaterialIcons name="groups" size={42} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Tap the + button to create a group.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  studentListPane: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  studentList: {
    paddingHorizontal: 14,
    gap: 5,
  },
  emptyChat: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
