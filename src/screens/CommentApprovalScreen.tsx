import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import {
  useGetNonApprovedCommentQuery,
  useApproveCommentMutation,
  useDeleteCommentMutation,
} from '../store/api';
import { Avatar, LoadingOverlay, AdminHeader, EmptyData } from '../component';
import { setModal, resetModal } from '../store/slices';

interface CommentItem {
  _id: string;
  content: string;
  createdAt: string;
  userDetail: {
    name: string;
    profilePicPath?: string;
  };
}

const CommentApprovalScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const {
    data: pendingComments = [],
    isLoading: loadingPendingComment,
    isFetching: fetchingPendingComment,
  } = useGetNonApprovedCommentQuery(undefined, { skip: !isFocused });

  const [rejectComment, { isLoading: isRejecting }] =
    useDeleteCommentMutation();
  const [approveComment, { isLoading: isApproving }] =
    useApproveCommentMutation();

  const handleApprove = (commentId: string) => {
    dispatch(
      setModal({
        state: 'confirm',
        visible: true,
        title: 'Are you sure?',
        description:
          'Do you want to *Approve* this comment? This action cannot be undone.',
        onCancel: () => {
          dispatch(resetModal());
        },
        onConfirm: async () => {
          try {
            await approveComment({ commentId }).unwrap();
            dispatch(
              setModal({
                state: 'success',
                visible: true,
                title: 'Comment Approved',
                description: 'The comment has been *Approved* by you.',
                onDone: () => {
                  dispatch(resetModal());
                },
              }),
            );
          } catch {
            dispatch(
              setModal({
                state: 'failure',
                visible: true,
                title: 'Failed to Approve the comment',
                description:
                  'Something went wrong while approve the comment. Please try again later.',
                onDone: () => {
                  dispatch(resetModal());
                },
              }),
            );
          }
        },
      }),
    );
  };

  const handleReject = (commentId: string) => {
    dispatch(
      setModal({
        state: 'confirm',
        visible: true,
        title: 'Are you sure?',
        description:
          'Do you want to *Reject* the comment? This action cannot be undone.',
        onCancel: () => {
          dispatch(resetModal());
        },
        onConfirm: async () => {
          try {
            await rejectComment({ commentId }).unwrap();
            dispatch(
              setModal({
                state: 'success',
                visible: true,
                title: 'Rejected',
                description: 'The comment successfully *Rejected*',
                onDone: () => {
                  dispatch(resetModal());
                },
              }),
            );
          } catch {
            dispatch(
              setModal({
                state: 'failure',
                visible: true,
                title: 'Failed to Reject the comment',
                description:
                  'Something went wrong while rejecting the comment. Please try again later.',
                onDone: () => {
                  dispatch(resetModal());
                },
              }),
            );
          }
        },
      }),
    );
  };

  const formatCommentDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  };

  const renderItem = ({ item }: { item: CommentItem }) => (
    <View style={styles.row}>
      <Avatar
        name={item.userDetail.name}
        profilePic={item.userDetail.profilePicPath}
      />

      <View style={styles.content}>
        <Text style={styles.name}>{item.userDetail.name}</Text>
        <Text style={styles.dateText}>{formatCommentDate(item.createdAt)}</Text>

        <Text style={styles.messageText}>&ldquo;{item.content}&rdquo;</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item._id)}
            hitSlop={8}
          >
            <MaterialIcons name="check-circle" size={15} color="#3b6ef6" />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(item._id)}
            hitSlop={8}
          >
            <MaterialIcons name="cancel" size={15} color="#e0245e" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AdminHeader header="Comment Approvals" />
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.listContent}
        data={pendingComments}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyData
            showLoader={loadingPendingComment || fetchingPendingComment}
            loadingMessage="Loading notifications..."
            emptyTitle="No Approval Request"
            emptyText=""
            icon="pending-actions"
          />
        }
      />
      <LoadingOverlay visible={isRejecting || isApproving} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3a3a3a',
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2d6e',
  },
  dateText: {
    fontSize: 12,
    color: '#9a9db8',
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3b4bb8',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d4fb',
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  approveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b6ef6',
    marginLeft: 5,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f9c9d6',
    backgroundColor: '#fdeef2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e0245e',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#eef0f5',
  },
});

export default CommentApprovalScreen;
