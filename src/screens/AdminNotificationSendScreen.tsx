import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { AdminHeader, LoadingOverlay, LoadingState } from '../component';
import {
  Student,
  useGetStudentsQuery,
  useSendNotificationMutation,
} from '../store/api';
import { AdminNotificationSendScreenStyles as styles } from './styles/AdminNotificationSendScreen.styles';

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

export default function AdminNotificationSendScreen() {
  const isFocused = useIsFocused();
  const [search, setSearch] = useState('');
  const [messageHeader, setMessageHeader] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: students = [], isLoading } = useGetStudentsQuery(undefined, {
    skip: !isFocused,
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
        })),
        messageHeader: messageHeader.trim(),
        messageBody: messageBody.trim(),
      }).unwrap();

      setSelectedIds(new Set());
      setMessageHeader('');
      setMessageBody('');
      Alert.alert('Notification Sent', 'Message sent successfully.');
    } catch {
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <AdminHeader header="Notification Send" />

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
                <Text style={styles.sectionTitle}>Notification</Text>
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
      <LoadingOverlay visible={isSending} label="Sending notification..." />
    </SafeAreaView>
  );
}
