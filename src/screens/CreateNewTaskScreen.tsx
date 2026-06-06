import React, { useCallback, useState } from 'react';
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
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useCreateQuestionMutation } from '../store/api';
import { AdminHeader, LoadingOverlay } from '../component';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  expression: string;
  answer: number | null;
};

type GenForm = {
  count: string;
  min: string;
  max: string;
  steps: string;
  symbols: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely evaluates a math string like "5+20+30+40" → 95 */
const evaluateMath = (expr: string): number | null => {
  try {
    const trimmedExpr = expr.trim();

    // Allow only digits and operators
    if (!/^[\d+\-*/().\s]+$/.test(trimmedExpr)) return null;
    if (/[+\-*/]{2,}/.test(trimmedExpr)) return null;
    if (/^[+*/]/.test(trimmedExpr) || /[+\-*/]$/.test(trimmedExpr)) {
      return null;
    }

    // eslint-disable-next-line no-eval
    const result = eval(trimmedExpr);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
};

const sanitizeMathInput = (value: string) =>
  value.replace(/[^\d+\-*/().\s]/g, '');

const SYMBOLS = ['+', '-', '*', '/'];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getNextSafeStep = (
  runningTotal: number,
  min: number,
  max: number,
  symbols: string[],
) => {
  const shuffledSymbols = [...symbols].sort(() => Math.random() - 0.5);

  for (const symbol of shuffledSymbols) {
    if (symbol === '-') {
      const maxSubtract = Math.min(max, Math.floor(runningTotal));

      if (maxSubtract >= min) {
        const number = randomInt(min, maxSubtract);
        return {
          symbol,
          number,
          nextTotal: runningTotal - number,
        };
      }

      continue;
    }

    if (symbol === '/') {
      const safeMin = Math.max(1, min);
      if (safeMin > max) continue;

      const number = randomInt(safeMin, max);
      return {
        symbol,
        number,
        nextTotal: runningTotal / number,
      };
    }

    const number = randomInt(min, max);

    return {
      symbol,
      number,
      nextTotal: symbol === '*' ? runningTotal * number : runningTotal + number,
    };
  }

  const number = randomInt(min, max);
  return {
    symbol: '+',
    number,
    nextTotal: runningTotal + number,
  };
};

const generateSafeExpression = (
  min: number,
  max: number,
  steps: number,
  symbols: string[],
) => {
  let runningTotal = randomInt(min, max);
  let expression = String(runningTotal);

  for (let index = 1; index < steps; index++) {
    const nextStep = getNextSafeStep(runningTotal, min, max, symbols);

    expression = `${expression}${nextStep.symbol}${nextStep.number}`;
    runningTotal = nextStep.nextTotal;
  }

  return expression;
};

// ─── Question Row ─────────────────────────────────────────────────────────────

const QuestionRow = ({
  item,
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

let nextId = 3; // start after mock data

const createEmptyQuestion = (): Question => ({
  id: String(nextId++),
  expression: '',
  answer: null,
});

const createQuestionFromExpression = (expression: string): Question => ({
  id: String(nextId++),
  expression,
  answer: evaluateMath(expression),
});

const DEFAULT_GEN_FORM: GenForm = {
  count: '25',
  min: '',
  max: '',
  steps: '4',
  symbols: ['+'],
};

export default function CreateNewTaskScreen() {
  const navigation = useNavigation<any>();
  const [taskId, setTaskId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenModalVisible, setIsGenModalVisible] = useState(false);
  const [genForm, setGenForm] = useState<GenForm>(DEFAULT_GEN_FORM);
  const [createQuestion] = useCreateQuestionMutation();
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion(),
  ]);

  const resetForm = useCallback(() => {
    setTaskId('');
    setIsSaving(false);
    setIsGenModalVisible(false);
    setGenForm(DEFAULT_GEN_FORM);
    setQuestions([createEmptyQuestion()]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return resetForm;
    }, [resetForm]),
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleExpressionChange = (id: string, val: string) => {
    const sanitizedValue = sanitizeMathInput(val);

    setQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? {
              ...q,
              expression: sanitizedValue,
              answer: evaluateMath(sanitizedValue),
            }
          : q,
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

  const updateGenField = (field: keyof Omit<GenForm, 'symbols'>) => {
    return (value: string) => {
      setGenForm(prev => ({
        ...prev,
        [field]: value.replace(/[^\d]/g, ''),
      }));
    };
  };

  const toggleSymbol = (symbol: string) => {
    setGenForm(prev => {
      const hasSymbol = prev.symbols.includes(symbol);
      const symbols = hasSymbol
        ? prev.symbols.filter(item => item !== symbol)
        : [...prev.symbols, symbol];

      return {
        ...prev,
        symbols,
      };
    });
  };

  const handleGenerateQuestions = () => {
    const count = Number(genForm.count);
    const min = Number(genForm.min);
    const max = Number(genForm.max);
    const steps = Number(genForm.steps);

    if (!count || count < 1) {
      Alert.alert('Invalid Count', 'No of question should be at least 1.');
      return;
    }
    if (!genForm.min || !genForm.max) {
      Alert.alert('Invalid Range', 'Min and max are required.');
      return;
    }
    if (min >= max) {
      Alert.alert('Invalid Range', 'Max should be greater than min.');
      return;
    }
    if (!steps || steps < 2) {
      Alert.alert('Invalid Steps', 'Steps should be at least 2.');
      return;
    }
    if (genForm.symbols.length === 0) {
      Alert.alert('Missing Symbol', 'Select at least one symbol.');
      return;
    }

    const generated = Array.from({ length: count }, () =>
      createQuestionFromExpression(
        generateSafeExpression(min, max, steps, genForm.symbols),
      ),
    );

    setQuestions(prev => {
      const existing = prev.filter(q => q.expression.trim() !== '');
      return [...existing, ...generated, createEmptyQuestion()];
    });
    setIsGenModalVisible(false);
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

  const handleSave = async () => {
    const filled = questions.filter(q => q.expression.trim() !== '');
    const taskIdentifier = taskId.trim();

    if (!taskIdentifier) {
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

    const question = filled.map(q => q.expression.trim());

    setIsSaving(true);
    try {
      await createQuestion({
        taskId: taskIdentifier,
        question,
      }).unwrap();

      setTaskId('');
      setQuestions([createEmptyQuestion()]);

      Alert.alert(
        'Task Saved',
        `Task "${taskIdentifier}" saved with ${question.length} question(s).`,
        [{ text: 'OK', onPress: () => navigation.navigate('HomeworkLibrary') }],
      );
    } catch (err) {
      console.log(err);

      const errorMessage =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        err.data &&
        typeof err.data === 'object' &&
        'err' in err.data
          ? String(err.data.err)
          : 'Failed to save task';

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filledQuestions = questions.filter(q => q.expression.trim() !== '');
  const isValid =
    taskId.trim().length > 0 &&
    filledQuestions.length > 0 &&
    filledQuestions.every(q => q.answer !== null);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Page Title ── */}
        <AdminHeader header="Create New Task" />

        {/* ── Card ── */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

            <TouchableOpacity
              style={styles.generateQuestionBtn}
              onPress={() => setIsGenModalVisible(true)}
              activeOpacity={0.75}
            >
              <MaterialIcons name="auto-awesome" size={16} color="#FFFFFF" />
              <Text style={styles.generateQuestionText}>Gen Questions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Save Task Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid || isSaving}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="check-circle-outline"
              size={20}
              color="#fff"
              style={styles.saveIcon}
            />
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Saving...' : 'Save Task'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isGenModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsGenModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Generate Questions</Text>
                <TouchableOpacity
                  onPress={() => setIsGenModalVisible(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.generatorGrid}>
                <View style={styles.generatorField}>
                  <Text style={styles.generatorLabel}>NO OF QUESTION</Text>
                  <TextInput
                    style={styles.generatorInput}
                    value={genForm.count}
                    onChangeText={updateGenField('count')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.generatorField}>
                  <Text style={styles.generatorLabel}>MIN</Text>
                  <TextInput
                    style={styles.generatorInput}
                    value={genForm.min}
                    onChangeText={updateGenField('min')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.generatorField}>
                  <Text style={styles.generatorLabel}>MAX</Text>
                  <TextInput
                    style={styles.generatorInput}
                    value={genForm.max}
                    onChangeText={updateGenField('max')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.generatorField}>
                  <Text style={styles.generatorLabel}>STEPS</Text>
                  <TextInput
                    style={styles.generatorInput}
                    value={genForm.steps}
                    onChangeText={updateGenField('steps')}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.generatorLabel}>SYMBOL</Text>
              <View style={styles.symbolRow}>
                {SYMBOLS.map(symbol => {
                  const isSelected = genForm.symbols.includes(symbol);

                  return (
                    <TouchableOpacity
                      key={symbol}
                      style={[
                        styles.symbolButton,
                        isSelected && styles.symbolButtonActive,
                      ]}
                      onPress={() => toggleSymbol(symbol)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.symbolButtonText,
                          isSelected && styles.symbolButtonTextActive,
                        ]}
                      >
                        {symbol}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.generateSubmitBtn}
                onPress={handleGenerateQuestions}
                activeOpacity={0.85}
              >
                <Text style={styles.generateSubmitText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isSaving} label="Saving task..." />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    paddingBottom: 8,
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
  generateQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 10,
    gap: 6,
  },
  generateQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Generator modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  generatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  generatorField: {
    width: '47%',
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  generatorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  generatorInput: {
    fontSize: 18,
    color: '#1E3A5F',
    fontWeight: '700',
    padding: 0,
  },
  symbolRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  symbolButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  symbolButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#64748B',
  },
  symbolButtonTextActive: {
    color: '#2563EB',
  },
  generateSubmitBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  generateSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
  saveIcon: {
    marginRight: 8,
  },
});
