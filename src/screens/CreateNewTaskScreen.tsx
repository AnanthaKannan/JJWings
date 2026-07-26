import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  useFocusEffect,
  //  useNavigation
} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useCreateQuestionMutation } from '../store/api';
import { AdminHeader, LoadingOverlay } from '../component';
import ReuseModal, { ReuseModalProps } from '../component/ReuseModal';
import { CreateNewTaskScreenStyles as styles } from './styles/CreateNewTaskScreen.styles';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  expression: string;
  answer: number | null;
  marks: string;
};

type TaskType = 'homework' | 'exam' | 'practice';

type GenForm = {
  count: string;
  min: string;
  max: string;
  steps: string;
  marks: string;
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

const getTaskTypeLabel = (type: TaskType) => {
  if (type === 'exam') return 'Exam';
  if (type === 'practice') return 'Practice';
  return 'Homework';
};

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
  showMarks,
  onChange,
  onMarksChange,
  onDelete,
}: {
  item: Question;
  index: number;
  showMarks: boolean;
  onChange: (id: string, val: string) => void;
  onMarksChange: (id: string, val: string) => void;
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

      {showMarks && item.expression !== '' && (
        <TextInput
          style={styles.marksInput}
          value={item.marks}
          onChangeText={val => onMarksChange(item.id, val)}
          placeholder="Pts"
          placeholderTextColor="#B0B8C8"
          keyboardType="number-pad"
        />
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
  marks: '',
});

const createQuestionFromExpression = (
  expression: string,
  marks = '',
): Question => ({
  id: String(nextId++),
  expression,
  answer: evaluateMath(expression),
  marks,
});

const DEFAULT_GEN_FORM: GenForm = {
  count: '25',
  min: '',
  max: '',
  steps: '4',
  marks: '1',
  symbols: ['+'],
};

const modalInitial: ReuseModalProps = {
  state: 'confirm',
  visible: false,
  title: '',
  description: '',
};

export default function CreateNewTaskScreen() {
  // const navigation = useNavigation<any>();
  const [taskId, setTaskId] = useState('');
  const [level, setLevel] = useState(0);
  const [taskType, setTaskType] = useState<TaskType>('homework');
  const [isOral, setIsOral] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenModalVisible, setIsGenModalVisible] = useState(false);
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [genForm, setGenForm] = useState<GenForm>(DEFAULT_GEN_FORM);
  const [createQuestion] = useCreateQuestionMutation();
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion(),
  ]);
  const [modal, setModal] = useState<ReuseModalProps>(modalInitial);

  const resetForm = useCallback(() => {
    setTaskId('');
    setLevel(0);
    setTaskType('homework');
    setIsOral(false);
    setIsSaving(false);
    setIsGenModalVisible(false);
    setIsLevelPickerOpen(false);
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

  const handleMarksChange = (id: string, val: string) => {
    const sanitizedValue = val.replace(/[^\d]/g, '');

    setQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? {
              ...q,
              marks: sanitizedValue,
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
      { id: String(nextId), expression: '', answer: null, marks: '' },
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
    if (!steps || steps < 2 || steps > 6) {
      Alert.alert(
        'Invalid Steps',
        'The process must have between 2 and 6 steps.',
      );
      return;
    }
    if (genForm.symbols.length === 0) {
      Alert.alert('Missing Symbol', 'Select at least one symbol.');
      return;
    }
    if (taskType === 'exam' && (!genForm.marks || Number(genForm.marks) < 1)) {
      Alert.alert(
        'Invalid Marks',
        'Marks should be at least 1 for exam questions.',
      );
      return;
    }

    const generated = Array.from({ length: count }, () =>
      createQuestionFromExpression(
        generateSafeExpression(min, max, steps, genForm.symbols),
        taskType === 'exam' ? genForm.marks : '',
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
        updated.push({
          id: String(nextId),
          expression: '',
          answer: null,
          marks: '',
        });
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

    const marks = filled.map(q => Number(q.marks));
    const hasInvalidMarks =
      taskType === 'exam' &&
      marks.some(mark => !Number.isFinite(mark) || mark < 1);

    if (hasInvalidMarks) {
      Alert.alert(
        'Missing Marks',
        'Add marks for every exam question. Marks should be at least 1.',
      );
      return;
    }

    const question = filled.map(q => q.expression.trim());

    setIsSaving(true);
    try {
      await createQuestion({
        taskId: taskIdentifier,
        question,
        level,
        type: taskType,
        ...(taskType === 'exam' ? { marks } : {}),
        ...(isOral ? { oral: true } : {}),
      }).unwrap();

      setTaskId('');
      setLevel(0);
      setTaskType('homework');
      setIsOral(false);
      setQuestions([createEmptyQuestion()]);

      setModal({
        visible: true,
        state: 'success',
        title: 'Task Saved',
        // onConfirm: () => navigation.navigate('HomeworkLibrary'),
        description: `Task "${taskIdentifier}" saved with ${question.length} question(s).`,
      });
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

      setModal({
        visible: true,
        state: 'failure',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filledQuestions = questions.filter(q => q.expression.trim() !== '');
  const isValid =
    taskId.trim().length > 0 &&
    filledQuestions.length > 0 &&
    filledQuestions.every(q => q.answer !== null) &&
    (taskType !== 'exam' ||
      filledQuestions.every(q => {
        const marks = Number(q.marks);
        return Number.isFinite(marks) && marks >= 1;
      }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Page Title ── */}
        <AdminHeader header="Create New Task" headerBackgroundColor="#EEF0F8" />

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

            <View style={styles.levelOralRow}>
              <View style={[styles.taskIdSection, styles.levelSection]}>
                <TouchableOpacity
                  style={styles.levelDropdown}
                  onPress={() => setIsLevelPickerOpen(true)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.levelDropdownText}>Level {level}</Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={22}
                    color="#4F46E5"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.oralOption}
                onPress={() => setIsOral(prev => !prev)}
                activeOpacity={0.82}
              >
                <View style={styles.oralOptionBody}>
                  <MaterialIcons
                    name={isOral ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={isOral ? '#2563EB' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.oralOptionText,
                      isOral && styles.oralOptionTextActive,
                    ]}
                  >
                    Oral
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.taskTypeRow}>
              {(['homework', 'practice', 'exam'] as TaskType[]).map(type => {
                const isSelected = taskType === type;
                const label = getTaskTypeLabel(type);

                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.taskTypeOption,
                      isSelected && styles.taskTypeOptionActive,
                    ]}
                    onPress={() => setTaskType(type)}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={[
                        styles.taskTypeText,
                        isSelected && styles.taskTypeTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Question List */}
            <FlatList
              data={questions}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => (
                <QuestionRow
                  item={item}
                  index={index}
                  showMarks={taskType === 'exam'}
                  onChange={handleExpressionChange}
                  onMarksChange={handleMarksChange}
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
                  <Text style={styles.generatorLabel}>STEPS</Text>
                  <TextInput
                    style={styles.generatorInput}
                    value={genForm.steps}
                    onChangeText={updateGenField('steps')}
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

                {taskType === 'exam' && (
                  <View style={styles.generatorField}>
                    <Text style={styles.generatorLabel}>MARKS</Text>
                    <TextInput
                      style={styles.generatorInput}
                      value={genForm.marks}
                      onChangeText={updateGenField('marks')}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
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

        <ReuseModal
          visible={modal.visible}
          state={modal.state}
          title={modal.title}
          description={modal.description}
          onConfirm={modal.onConfirm}
          onCancel={() => {
            setModal(modalInitial);
          }}
        />

        <Modal
          visible={isLevelPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsLevelPickerOpen(false)}
        >
          <Pressable
            style={styles.levelModalBackdrop}
            onPress={() => setIsLevelPickerOpen(false)}
          >
            <Pressable style={styles.levelModal}>
              <View style={styles.levelModalHeader}>
                <Text style={styles.levelModalTitle}>Select Level</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsLevelPickerOpen(false)}
                >
                  <MaterialIcons name="close" size={20} color="#334155" />
                </TouchableOpacity>
              </View>
              <View style={styles.levelGrid}>
                {Array.from({ length: 11 }, (_, value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.levelOption,
                      level === value && styles.levelOptionActive,
                    ]}
                    onPress={() => {
                      setLevel(value);
                      setIsLevelPickerOpen(false);
                    }}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={[
                        styles.levelOptionText,
                        level === value && styles.levelOptionTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isSaving} label="Saving task..." />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
