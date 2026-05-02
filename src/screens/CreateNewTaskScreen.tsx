import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  expression: string;
  answer: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely evaluates a math string like "5+20+30+40" → 95 */
const evaluateMath = (expr: string): number | null => {
  try {
    // Allow only digits and operators
    if (!/^[\d+\-*/().\s]+$/.test(expr)) return null;
    // eslint-disable-next-line no-eval
    const result = eval(expr);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
};

// ─── Question Row ─────────────────────────────────────────────────────────────

const QuestionRow = ({
  item,
  index,
  onChange,
  onDelete,
}: {
  item: Question;
  index: number;
  onChange: (id: string, val: string) => void;
  onDelete: (id: string) => void;
}) => {
  const isPlaceholder = item.expression === '';
  const answer = item.answer;

  return (
    <View style={styles.questionRow}>
      <TextInput
        style={[
          styles.expressionInput,
          isPlaceholder && styles.expressionPlaceholder,
        ]}
        value={item.expression}
        onChangeText={val => onChange(item.id, val)}
        placeholder="Enter math string"
        placeholderTextColor="#B0B8C8"
        keyboardType="default"
        returnKeyType="done"
      />

      {/* Answer / dots */}
      {item.expression === '' ? (
        <Text style={styles.dotsText}>···</Text>
      ) : answer !== null ? (
        <Text style={styles.answerText}>{answer}</Text>
      ) : (
        <Text style={styles.errorText}>?</Text>
      )}

      {/* Delete — only on filled rows */}
      {item.expression !== '' && (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={14} color="#CBD5E0" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Decorative Blobs ─────────────────────────────────────────────────────────

const Blobs = () => (
  <View style={styles.blobsRow}>
    <View
      style={[
        styles.blob,
        { backgroundColor: '#FDE68A', width: 36, height: 36 },
      ]}
    />
    <View
      style={[
        styles.blob,
        { backgroundColor: '#FCD34D', width: 30, height: 30, marginLeft: -10 },
      ]}
    />
    <View
      style={[
        styles.blob,
        { backgroundColor: '#FCA5A5', width: 26, height: 26, marginLeft: -8 },
      ]}
    />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

let nextId = 3; // start after mock data

export default function CreateNewTaskScreen({
  navigation,
}: {
  navigation: any;
}) {
  const [taskId, setTaskId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', expression: '5+20+30+40', answer: 95 },
    { id: '2', expression: '12+8+15-4', answer: 31 },
    { id: '3', expression: '', answer: null }, // empty input row
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleExpressionChange = (id: string, val: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === id ? { ...q, expression: val, answer: evaluateMath(val) } : q,
      ),
    );
  };

  const handleAddQuestion = () => {
    // If there's already an empty row, focus it rather than adding another
    const hasEmpty = questions.some(q => q.expression === '');
    if (hasEmpty) return;

    nextId++;
    setQuestions(prev => [
      ...prev,
      { id: String(nextId), expression: '', answer: null },
    ]);
  };

  const handleDelete = (id: string) => {
    setQuestions(prev => {
      const updated = prev.filter(q => q.id !== id);
      // Always keep at least one empty row
      const hasEmpty = updated.some(q => q.expression === '');
      if (!hasEmpty) {
        nextId++;
        updated.push({ id: String(nextId), expression: '', answer: null });
      }
      return updated;
    });
  };

  const handleSave = () => {
    const filled = questions.filter(q => q.expression.trim() !== '');
    if (!taskId.trim()) {
      Alert.alert('Missing Task ID', 'Please enter a task identifier.');
      return;
    }
    if (filled.length === 0) {
      Alert.alert('No Questions', 'Add at least one math question.');
      return;
    }
    const invalid = filled.filter(q => q.answer === null);
    if (invalid.length > 0) {
      Alert.alert(
        'Invalid Expression',
        `"${invalid[0].expression}" could not be evaluated. Use only numbers and + - * /`,
      );
      return;
    }

    // TODO: dispatch(saveTask({ taskId, questions: filled }))
    Alert.alert(
      'Task Saved',
      `Task "${taskId}" saved with ${filled.length} question(s).`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  const isValid =
    taskId.trim().length > 0 &&
    questions.some(q => q.expression.trim() !== '' && q.answer !== null);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Page Title ── */}
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={22} color="#1A202C" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Create New Task</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {/* Task ID field */}
          <View style={styles.taskIdSection}>
            <Text style={styles.taskIdLabel}>TASK IDENTIFIER</Text>
            <TextInput
              style={styles.taskIdInput}
              value={taskId}
              onChangeText={setTaskId}
              placeholder="e.g. 5A-01"
              placeholderTextColor="#B0B8C8"
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          {/* Question List */}
          <FlatList
            data={questions}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <QuestionRow
                item={item}
                index={index}
                onChange={handleExpressionChange}
                onDelete={handleDelete}
              />
            )}
            scrollEnabled={false}
            style={styles.questionList}
          />

          {/* Add Question Button */}
          <TouchableOpacity
            style={styles.addQuestionBtn}
            onPress={handleAddQuestion}
            activeOpacity={0.75}
          >
            <MaterialIcons name="add" size={16} color="#6B7280" />
            <Text style={styles.addQuestionText}>Add Question</Text>
          </TouchableOpacity>

          {/* Decorative blobs */}
          <Blobs />
        </View>

        {/* ── Save Task Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="check-circle-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveBtnText}>Save Task</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
  },

  // Title bar
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: { padding: 4 },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A5F',
    letterSpacing: -0.4,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },

  // Task ID
  taskIdSection: {
    backgroundColor: '#F0F4FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    marginBottom: 20,
  },
  taskIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  taskIdInput: {
    fontSize: 16,
    color: '#1E3A5F',
    fontWeight: '500',
    padding: 0,
  },

  // Question list
  questionList: {
    marginBottom: 8,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  expressionInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    padding: 0,
  },
  expressionPlaceholder: {
    fontWeight: '400',
  },
  answerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B82F6',
    minWidth: 36,
    textAlign: 'right',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    minWidth: 36,
    textAlign: 'right',
    marginLeft: 8,
  },
  dotsText: {
    fontSize: 16,
    color: '#CBD5E0',
    marginLeft: 8,
    letterSpacing: 2,
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 2,
  },

  // Add question
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 30,
    paddingVertical: 11,
    marginTop: 12,
    gap: 6,
  },
  addQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Blobs
  blobsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingLeft: 8,
  },
  blob: {
    borderRadius: 100,
    opacity: 0.85,
  },

  // Footer / Save
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 30,
    paddingVertical: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
