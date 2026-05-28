import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { AdminHeader, LoadingState } from '../component';
import {
  Student,
  useGetStudentsQuery,
  useSendNotificationMutation,
} from '../store/api';

const StudentRow = ({
  item,
  selected,
  onToggle,
}: {
  item: Student;
  selected: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    style={[styles.studentRow, selected && styles.studentRowSelected]}
    onPress={onToggle}
    activeOpacity={0.75}
  >
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {item.name
          .split(' ')
          .map(part => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </Text>
    </View>
    <View style={styles.studentInfo}>
      <Text style={styles.studentName}>{item.name || 'Student'}</Text>
      <Text style={styles.studentMeta}>
        {item.fcmTokens.length} token{item.fcmTokens.length === 1 ? '' : 's'}
      </Text>
    </View>
    <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
      {selected && <MaterialIcons name="check" size={15} color="#fff" />}
    </View>
  </TouchableOpacity>
);

export default function AdminMessageScreen() {
  const isFocused = useIsFocused();
  const [search, setSearch] = useState('');
  const [messageHeader, setMessageHeader] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: students = [], isLoading } = useGetStudentsQuery(undefined, {
    skip: !isFocused,
    refetchOnMountOrArgChange: true,
  });
  const [sendNotification, { isLoading: isSending }] =
    useSendNotificationMutation();

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter(
      student =>
        student.name.toLowerCase().includes(query) ||
        student.studentId?.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query),
    );
  }, [search, students]);

  const selectedStudents = students.filter(student =>
    selectedIds.has(student.id),
  );

  const isFormValid =
    selectedStudents.length > 0 &&
    messageHeader.trim().length > 0 &&
    messageBody.trim().length > 0;

  const toggleStudent = (studentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  };

  const handleSend = async () => {
    if (!isFormValid || isSending) return;

    try {
      await sendNotification({
        studentIds: selectedStudents.map(student => ({
          id: student.id,
          tokens: student.fcmTokens,
        })),
        messageHeader: messageHeader.trim(),
        messageBody: messageBody.trim(),
      }).unwrap();

      setSelectedIds(new Set());
      setMessageHeader('');
      setMessageBody('');
      Alert.alert('Notification Sent', 'Message sent successfully.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <AdminHeader header="Send Message" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={isLoading ? [] : filteredStudents}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Message</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  placeholderTextColor="#94A3B8"
                  value={messageHeader}
                  onChangeText={setMessageHeader}
                />
                <TextInput
                  style={[styles.input, styles.bodyInput]}
                  placeholder="Body message"
                  placeholderTextColor="#94A3B8"
                  value={messageBody}
                  onChangeText={setMessageBody}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.studentHeader}>
                <Text style={styles.sectionTitle}>Students</Text>
                <Text style={styles.selectedCount}>
                  {selectedStudents.length} selected
                </Text>
              </View>

              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students"
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </>
          }
          renderItem={({ item }) => (
            <StudentRow
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleStudent(item.id)}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <LoadingState label="Loading students..." />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            )
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!isFormValid || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!isFormValid || isSending}
            activeOpacity={0.85}
          >
            <Text style={styles.sendText}>
              {isSending ? 'Sending...' : 'Send Notification'}
            </Text>
            {!isSending && <MaterialIcons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 10,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  bodyInput: {
    minHeight: 94,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  selectedCount: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  studentRowSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2563EB',
    fontWeight: '900',
    fontSize: 13,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  studentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
  },
  emptyText: {
    color: '#64748B',
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  sendButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
