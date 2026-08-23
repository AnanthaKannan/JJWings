import React, { FC } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface List {
  key: string;
  value: string;
}

export interface GroupStudentsModalProps {
  visible: boolean;
  onClose: () => void;
  /** Name of the group, shown as the modal header */
  title: string;
  /** Students belonging to this group */
  list: List[];
  /** Shown when `students` is empty (default: 'No students in this group') */
  emptyText?: string;
}

const ListModal: FC<GroupStudentsModalProps> = ({
  visible,
  onClose,
  title,
  list,
  emptyText = 'Empty',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                  <MaterialIcons name="close" size={22} color="#65676b" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <FlatList
                data={list}
                keyExtractor={item => item.key}
                ItemSeparatorComponent={() => (
                  <View style={styles.itemDivider} />
                )}
                contentContainerStyle={
                  list.length === 0 && styles.emptyContainer
                }
                renderItem={({ item }) => (
                  <View style={styles.studentRow}>
                    <Text style={styles.studentName}>{item.value}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>{emptyText}</Text>
                }
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050505',
    flex: 1,
    marginRight: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e6eb',
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e6eb',
    marginLeft: 16,
  },
  studentRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  studentName: {
    fontSize: 15,
    color: '#050505',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#65676b',
  },
});

export default ListModal;
