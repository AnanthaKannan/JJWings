import React from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useGetNonApprovedCommentQuery } from '../store/api';
import { Avatar } from '../component';

const PENDING_COMMENTS = [
  {
    _id: '1',
    name: 'Arjun Kumar',
    initials: 'AK',
    avatarColor: '#f9c88f',
    date: 'Oct 24',
    time: '10:30 AM',
    content:
      'This abacus challenge was really fun! Can we have more addition tasks?',
  },
  {
    _id: '2',
    name: 'Sarah Miller',
    initials: 'SM',
    avatarColor: '#f6d94a',
    date: 'Oct 24',
    time: '09:15 AM',
    content:
      "I don't understand how to carry over the beads for this one. It's too hard!",
  },
];

const CommentApprovalScreen: React.FC = () => {
  const {
    data: pendingComments = [],
    isLoading: loadingPendingComment,
    isFetching: fetchingPeningComment,
  } = useGetNonApprovedCommentQuery();

  const handleApprove = (commentId: string) => {
    // TODO: wire up approve mutation
    console.log('approve', commentId);
  };

  const handleReject = (commentId: string) => {
    // TODO: wire up reject mutation
    console.log('reject', commentId);
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.listContent}
    >
      {pendingComments.map((item, index) => (
        <View key={item._id}>
          <View style={styles.row}>
            <Avatar
              name={item.userDetail.name}
              profilePic={item.userDetail.profilePicPath}
            />

            <View style={styles.content}>
              <Text style={styles.name}>{item.userDetail.name}</Text>
              <Text style={styles.dateText}>
                {formatCommentDate(item.createdAt)}
              </Text>

              <Text style={styles.messageText}>
                &ldquo;{item.content}&rdquo;
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(item._id)}
                  hitSlop={8}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={15}
                    color="#3b6ef6"
                  />
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

          {index < PENDING_COMMENTS.length - 1 && (
            <View style={styles.divider} />
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
