import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Group } from '../../types';
import Avatar from '../Avatar';

const GroupRow = ({
  group,
  onPress,
  onEdit,
  onDelete,
}: {
  group: Group;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <TouchableOpacity
    style={styles.studentRow}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <Avatar name={group.groupName} />
    <View style={styles.conversationBody}>
      <View style={styles.conversationTop}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {group.groupName}
        </Text>
      </View>
      <Text style={styles.conversationPreview} numberOfLines={1}>
        {group.studentCount} {group.studentCount === 1 ? 'student' : 'students'}
      </Text>
    </View>
    <View style={styles.groupActions}>
      <TouchableOpacity
        style={styles.groupActionButton}
        onPress={onEdit}
        activeOpacity={0.82}
      >
        <MaterialIcons name="edit" size={18} color="#4F46E5" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.groupActionButton, styles.groupDeleteButton]}
        onPress={onDelete}
        activeOpacity={0.82}
      >
        <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default GroupRow;

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
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  groupActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDeleteButton: {
    backgroundColor: '#FEF2F2',
  },
});
