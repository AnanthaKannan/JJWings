import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';

import {
  AdminHeader,
  AdminMessageList,
  LoadingOverlay,
  MessageChatPane,
  MessageType,
} from '../component';
import {
  MessageStudent,
  useGetMessageStudentsQuery,
  useGetMessageGroupQuery,
  useReadMessagesMutation,
  useDeleteMessageGroupMutation,
} from '../store/api';
import { RootState } from '../store/store';
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler';
import { Group } from '../types';
import ReuseModal, { ReuseModalProps } from '../component/ReuseModal';

const getInitialMessageFilter = (filter?: string): MessageType =>
  filter === 'group' ? 'group' : 'individual';

const MODAL_INITIAL: ReuseModalProps = {
  state: 'confirm',
  visible: false,
  title: '',
  description: '',
};

export default function AdminMessageScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<MessageType>(() =>
    getInitialMessageFilter(route.params?.filter),
  );
  const [modal, setModal] = useState<ReuseModalProps>(MODAL_INITIAL);

  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<MessageStudent | null>(null);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<Group | null>(
    null,
  );

  const isChatOpen = Boolean(selectedStudentDetail || selectedGroupDetail);

  useEffect(() => {
    setSelectedFilter(getInitialMessageFilter(route.params?.filter));
  }, [route.params?.filter]);

  const {
    data: messageStudents = [],
    isLoading: isStudentListLoading,
    refetch: refetchMessageStudents,
  } = useGetMessageStudentsQuery(undefined, {
    skip: !isFocused || !isAdmin,
  });
  const {
    data: groupList = [],
    isLoading: isGroupListLoading,
    refetch: refetchGroupList,
  } = useGetMessageGroupQuery(undefined, {
    skip: !isFocused || !isAdmin || !(selectedFilter === 'group'),
  });

  const [deleteMessageGroup, { isLoading: isDeletingGroup }] =
    useDeleteMessageGroupMutation();
  const [readMessages] = useReadMessagesMutation();
  const isGroupActionLoading = isDeletingGroup;

  useEffect(() => {
    if (!isAdmin) return;

    const parent = navigation.getParent(); // Tab navigator

    parent?.setOptions({
      tabBarStyle: isChatOpen
        ? { display: 'none' }
        : {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
          },
    });

    return () => {
      parent?.setOptions({
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },
      });
    };
  }, [isChatOpen, isAdmin, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isAdmin && !isChatOpen) {
        if (selectedFilter === 'group') {
          await refetchGroupList();
        } else {
          await refetchMessageStudents();
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    isAdmin,
    isChatOpen,
    selectedFilter,
    refetchGroupList,
    refetchMessageStudents,
  ]);

  const handleSelectStudent = useCallback(
    (student: MessageStudent) => {
      setSelectedStudentDetail(student);
      setSelectedGroupDetail(null);

      if (student.unreadMessageCount <= 0) return;

      readMessages({ studentId: student.id })
        .unwrap()
        .catch(() => undefined);
    },
    [readMessages],
  );

  const handleSelectGroup = useCallback((group: Group) => {
    setSelectedStudentDetail(null);
    setSelectedGroupDetail(group);
  }, []);

  const handleChatBack = useCallback(() => {
    if (isAdmin) {
      setSelectedStudentDetail(null);
      setSelectedGroupDetail(null);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(
      CommonActions.navigate({
        name: 'Progress',
      }),
    );
  }, [isAdmin, navigation]);

  const handleFilterSelect = (value: MessageType) => {
    setSelectedFilter(value);
  };

  const creteNewGroup = () => {
    navigation.navigate('CreateMessageGroup');
  };

  const handleEditGroup = (group: Group) => {
    navigation.navigate('CreateMessageGroup', { group });
  };

  const deleteGroup = async (group: Group) => {
    try {
      await deleteMessageGroup(group._id).unwrap();
      setModal({
        visible: true,
        state: 'success',
        title: 'Group Deleted',
        description: `*${group.groupName}* has been deleted.`,
        onCancel: () => setModal(MODAL_INITIAL),
      });
    } catch (error) {
      console.error('Failed to delete group:', error);
      setModal({
        visible: true,
        state: 'failure',
        title: 'Group Not Deleted',
        description: 'Please try again.',
        onCancel: () => setModal(MODAL_INITIAL),
      });
    }
  };

  const confirmDeleteGroup = (group: Group) => {
    setModal({
      visible: true,
      state: 'confirm',
      title: 'Delete Group',
      description: `Do you want to delete *${group.groupName}*?`,
      confirmLabel: 'Delete',
      onConfirm: () => deleteGroup(group),
      onCancel: () => setModal(MODAL_INITIAL),
    });
  };

  useAndroidBackHandler(handleChatBack);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      {isAdmin && !isChatOpen ? (
        <AdminHeader header="Messages" headerBackgroundColor="#F8F9FB" />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isAdmin && !isChatOpen ? (
          <AdminMessageList
            selectedFilter={selectedFilter}
            students={messageStudents}
            groups={groupList}
            refreshing={refreshing}
            isStudentListLoading={isStudentListLoading}
            isGroupListLoading={isGroupListLoading}
            onRefresh={onRefresh}
            onFilterSelect={handleFilterSelect}
            onCreateGroup={creteNewGroup}
            onSelectStudent={handleSelectStudent}
            onSelectGroup={handleSelectGroup}
            onEditGroup={handleEditGroup}
            onDeleteGroup={confirmDeleteGroup}
          />
        ) : (
          <MessageChatPane
            selectedStudentDetail={selectedStudentDetail}
            selectedGroupDetail={selectedGroupDetail}
            onBack={handleChatBack}
          />
        )}
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isGroupActionLoading} label="Processing..." />
      <ReuseModal
        visible={modal.visible}
        state={modal.state}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel ?? (() => setModal(MODAL_INITIAL))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  flex: {
    flex: 1,
  },
});
