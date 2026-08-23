import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import { MessageStudent } from '../../store/api';

const StudentRow = ({
  student,
  onPress,
}: {
  student: MessageStudent;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.studentRow}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <Avatar name={student.name} profilePic={student.profilePicPath} />
    <View style={styles.conversationBody}>
      <View style={styles.conversationTop}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {student.name}
        </Text>
      </View>
      <Text style={styles.conversationPreview} numberOfLines={1}>
        {student.studentId ?? `Level ${student.level ?? '-'}`}
      </Text>
    </View>
    {student.unreadMessageCount > 0 ? (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadBadgeText}>
          {student.unreadMessageCount > 99 ? '99+' : student.unreadMessageCount}
        </Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

export default StudentRow;

const styles = StyleSheet.create({
  studentRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conversationBody: {
    flex: 1,
    marginLeft: 10,
  },
  conversationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationName: {
    flex: 1,
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  conversationPreview: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
});
