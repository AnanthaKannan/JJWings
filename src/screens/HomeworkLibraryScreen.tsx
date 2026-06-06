import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useIsFocused } from '@react-navigation/native';
import { AdminHeader, LoadingOverlay, LoadingState } from '../component';
import {
  useDeleteQuestionMutation,
  useGetQuestionsQuery,
  useUpdateQuestionMutation,
} from '../store/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleIcon = 'grid' | 'plus' | 'bolt' | 'apps';

type Module = {
  id: string;
  title: string;
  questions: string[];
  iconType: ModuleIcon;
  iconBg: string;
  iconColor: string;
  iconLabel?: string;
  level?: number;
  updatedAt?: string;
};

const ICON_COLORS = [
  { iconBg: '#DBEAFE', iconColor: '#3B82F6', iconType: 'grid' as ModuleIcon },
  { iconBg: '#FEF3C7', iconColor: '#F59E0B', iconType: 'plus' as ModuleIcon },
  { iconBg: '#FEF9C3', iconColor: '#EAB308', iconType: 'bolt' as ModuleIcon },
  { iconBg: '#E0E7FF', iconColor: '#6366F1', iconType: 'apps' as ModuleIcon },
  { iconBg: '#DCFCE7', iconColor: '#22C55E', iconType: 'bolt' as ModuleIcon },
  { iconBg: '#FCE7F3', iconColor: '#EC4899', iconType: 'grid' as ModuleIcon },
];

const evaluateMath = (expr: string): string => {
  try {
    const trimmed = expr.trim();
    if (!/^[\d+\-*/().\s]+$/.test(trimmed)) return 'N/A';
    if (/[+\-*/]{2,}/.test(trimmed)) return 'N/A';
    if (/^[+*/]/.test(trimmed) || /[+\-*/]$/.test(trimmed)) return 'N/A';
    // eslint-disable-next-line no-eval
    const result = eval(trimmed);
    if (typeof result !== 'number' || !isFinite(result)) return 'N/A';
    return String(Math.round(result * 100) / 100);
  } catch {
    return 'N/A';
  }
};

// ─── Module Icon ──────────────────────────────────────────────────────────────

const formatHomeworkTime = (dateValue?: string) => {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const ModuleIcon = ({
  iconType,
  iconBg,
  iconColor,
  iconLabel,
}: Pick<Module, 'iconType' | 'iconBg' | 'iconColor' | 'iconLabel'>) => {
  const iconMap: Record<ModuleIcon, string> = {
    grid: 'grid-view',
    plus: 'add',
    bolt: 'bolt',
    apps: 'apps',
  };

  return (
    <View style={[styles.moduleIcon, { backgroundColor: iconBg }]}>
      {iconLabel ? (
        <Text style={[styles.moduleIconLabel, { color: iconColor }]}>
          {iconLabel}
        </Text>
      ) : (
        <MaterialIcons name={iconMap[iconType]} size={22} color={iconColor} />
      )}
    </View>
  );
};

// ─── Module Card ──────────────────────────────────────────────────────────────

const ModuleCard = ({
  item,
  onPress,
  onUpdatePress,
  onDeletePress,
  isUpdating,
  isDeleting,
}: {
  item: Module;
  onPress: () => void;
  onUpdatePress: () => void;
  onDeletePress: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) => {
  const updatedTime = formatHomeworkTime(item.updatedAt);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardBottom}>
              <View style={styles.questionsBadge}>
                <MaterialIcons name="quiz" size={14} color="#94A3B8" />
                <Text style={styles.questionsText}>
                  {item.questions.length} Questions
                </Text>
              </View>
              <View style={styles.levelBadge}>
                <MaterialIcons name="school" size={14} color="#4F46E5" />
                <Text style={styles.levelText}>
                  Level {typeof item.level === 'number' ? item.level : '-'}
                </Text>
              </View>
              {updatedTime ? (
                <View style={styles.updatedBadge}>
                  <MaterialIcons name="schedule" size={14} color="#94A3B8" />
                  <Text style={styles.updatedText}>{updatedTime}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.actionButtonOff]}
              onPress={event => {
                event.stopPropagation();
                onUpdatePress();
              }}
              disabled={isUpdating}
              activeOpacity={0.82}
            >
              <MaterialIcons name="edit" size={19} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.actionButtonOff]}
              onPress={event => {
                event.stopPropagation();
                onDeletePress();
              }}
              disabled={isDeleting}
              activeOpacity={0.82}
            >
              <MaterialIcons name="delete-outline" size={20} color="#B91C1C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeworkLibraryScreen() {
  const isFocused = useIsFocused();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const { data: questionsData, isLoading } = useGetQuestionsQuery(
    selectedLevel === null ? undefined : { level: selectedLevel },
    {
      skip: !isFocused,
    },
  );
  const [deleteQuestion, { isLoading: isDeleting }] =
    useDeleteQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] =
    useUpdateQuestionMutation();

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [editQuestionId, setEditQuestionId] = useState('');
  const [editLevel, setEditLevel] = useState(0);
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [isFilterLevelPickerOpen, setIsFilterLevelPickerOpen] = useState(false);

  const modules = useMemo(() => {
    if (!questionsData) return [];

    return questionsData.map((q, index) => ({
      id: q.id,
      title: q.questionId ?? q.id,
      questions: q.question,
      level: q.level,
      updatedAt: q.updatedAt,
      ...ICON_COLORS[index % ICON_COLORS.length],
    }));
  }, [questionsData]);

  const filteredModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return modules;

    return modules.filter(module => {
      const questionText = module.questions.join(' ').toLowerCase();
      return (
        module.title.toLowerCase().includes(query) ||
        questionText.includes(query)
      );
    });
  }, [modules, searchTerm]);

  const handleModulePress = (item: Module) => {
    setSelectedModule(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedModule(null);
  };

  const openUpdateModal = (item: Module) => {
    setEditModule(item);
    setEditQuestionId(item.title);
    setEditLevel(typeof item.level === 'number' ? item.level : 0);
  };

  const closeUpdateModal = () => {
    setEditModule(null);
    setEditQuestionId('');
    setEditLevel(0);
    setIsLevelPickerOpen(false);
  };

  const handleUpdateQuestion = async () => {
    const nextQuestionId = editQuestionId.trim();

    if (!editModule || !nextQuestionId) {
      Alert.alert('Missing Task ID', 'Please enter a task identifier.');
      return;
    }

    try {
      await updateQuestion({
        id: editModule.id,
        questionId: nextQuestionId,
        level: editLevel,
      }).unwrap();

      if (selectedModule?.id === editModule.id) {
        setSelectedModule({
          ...selectedModule,
          title: nextQuestionId,
          level: editLevel,
        });
      }

      closeUpdateModal();
      Alert.alert('Homework Updated', 'The homework details were updated.');
    } catch {
      Alert.alert(
        'Unable to update',
        'Please try updating this homework again.',
      );
    }
  };

  const handleDeletePress = (item: Module) => {
    Alert.alert(
      'Delete homework?',
      `Delete "${item.title}" and its ${item.questions.length} question(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuestion({ questionId: item.id }).unwrap();
              if (selectedModule?.id === item.id) {
                closeModal();
              }
            } catch {
              Alert.alert(
                'Unable to delete',
                'Please try deleting this homework again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <AdminHeader header="Homework Library" />
      <View style={styles.headerGap} />
      <View style={styles.searchFilterRow}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search homework"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm ? (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchTerm('')}
              activeOpacity={0.75}
            >
              <MaterialIcons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.levelFilterButton,
            selectedLevel !== null && styles.levelFilterButtonActive,
          ]}
          onPress={() => setIsFilterLevelPickerOpen(true)}
          activeOpacity={0.82}
        >
          <MaterialIcons
            name="filter-list"
            size={18}
            color={selectedLevel === null ? '#64748B' : '#4F46E5'}
          />
          <Text
            style={[
              styles.levelFilterText,
              selectedLevel !== null && styles.levelFilterTextActive,
            ]}
          >
            {selectedLevel === null ? 'All' : `L${selectedLevel}`}
          </Text>
        </TouchableOpacity>
      </View>
      {/* ── Module List ── */}
      <FlatList
        data={filteredModules}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ModuleCard
            item={item}
            onPress={() => handleModulePress(item)}
            onUpdatePress={() => openUpdateModal(item)}
            onDeletePress={() => handleDeletePress(item)}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        )}
        ListEmptyComponent={
          isFocused && isLoading ? (
            <LoadingState label="Loading questions..." />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="library-books" size={48} color="#CBD5E0" />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No homework found' : 'No questions yet'}
              </Text>
              <Text style={styles.emptySubText}>
                {searchTerm
                  ? 'Try searching another task or question'
                  : 'Questions will appear here when created'}
              </Text>
            </View>
          )
        }
      />

      {/* ── Questions Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedModule?.title}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <MaterialIcons name="close" size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>

            {/* Questions List */}
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedModule?.questions.map((question, idx) => (
                <View key={idx} style={styles.questionItem}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.questionRow}>
                    <Text style={styles.questionText}>{question}</Text>
                    <Text style={styles.answerValue}>
                      {evaluateMath(question)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(editModule)}
        transparent
        animationType="fade"
        onRequestClose={closeUpdateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.updateModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Update Homework
              </Text>
              <TouchableOpacity onPress={closeUpdateModal}>
                <MaterialIcons name="close" size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>

            <View style={styles.updateModalContent}>
              <View style={styles.updateFieldGroup}>
                <Text style={styles.updateLabel}>Task ID</Text>
                <TextInput
                  style={styles.updateInput}
                  value={editQuestionId}
                  onChangeText={setEditQuestionId}
                  placeholder="Enter task identifier"
                  placeholderTextColor="#A0AEC0"
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleUpdateQuestion}
                />
              </View>

              <View style={styles.updateFieldGroup}>
                <Text style={styles.updateLabel}>Level</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setIsLevelPickerOpen(true)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.dropdownValue}>Level {editLevel}</Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={22}
                    color="#4F46E5"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.updateSubmitButton,
                  (!editQuestionId.trim() || isUpdating) &&
                    styles.updateSubmitButtonOff,
                ]}
                onPress={handleUpdateQuestion}
                disabled={!editQuestionId.trim() || isUpdating}
                activeOpacity={0.85}
              >
                <Text style={styles.updateSubmitText}>
                  {isUpdating ? 'Updating...' : 'Update Homework'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                    editLevel === value && styles.levelOptionActive,
                  ]}
                  onPress={() => {
                    setEditLevel(value);
                    setIsLevelPickerOpen(false);
                  }}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      editLevel === value && styles.levelOptionTextActive,
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

      <Modal
        visible={isFilterLevelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterLevelPickerOpen(false)}
      >
        <Pressable
          style={styles.levelModalBackdrop}
          onPress={() => setIsFilterLevelPickerOpen(false)}
        >
          <Pressable style={styles.levelModal}>
            <View style={styles.levelModalHeader}>
              <Text style={styles.levelModalTitle}>Filter Level</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsFilterLevelPickerOpen(false)}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.levelAllOption,
                selectedLevel === null && styles.levelOptionActive,
              ]}
              onPress={() => {
                setSelectedLevel(null);
                setIsFilterLevelPickerOpen(false);
              }}
              activeOpacity={0.82}
            >
              <Text
                style={[
                  styles.levelOptionText,
                  selectedLevel === null && styles.levelOptionTextActive,
                ]}
              >
                All Levels
              </Text>
            </TouchableOpacity>
            <View style={styles.levelGrid}>
              {Array.from({ length: 11 }, (_, value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.levelOption,
                    selectedLevel === value && styles.levelOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedLevel(value);
                    setIsFilterLevelPickerOpen(false);
                  }}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      selectedLevel === value && styles.levelOptionTextActive,
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

      <LoadingOverlay
        visible={isDeleting || isUpdating}
        label={isUpdating ? 'Updating homework...' : 'Deleting homework...'}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
  },
  headerGap: {
    marginTop: 15,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    color: '#1A202C',
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  levelFilterButton: {
    height: 48,
    minWidth: 78,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  levelFilterButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  levelFilterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  levelFilterTextActive: {
    color: '#4F46E5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    padding: 6,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 24,
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -1,
    lineHeight: 36,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardDetails: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  questionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  questionsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  updatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  updatedText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
  },
  updateButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonOff: {
    opacity: 0.55,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptySubText: {
    fontSize: 13,
    color: '#CBD5E0',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  updateModalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modalSpacer: {
    width: 24,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  updateModalContent: {
    padding: 18,
    gap: 18,
  },
  updateFieldGroup: {
    gap: 8,
  },
  updateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
  },
  updateInput: {
    backgroundColor: '#F5F6FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#2D3748',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  dropdownButton: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F5F6FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '700',
  },
  updateSubmitButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: '#2C3E8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  updateSubmitButtonOff: {
    backgroundColor: '#A0AEC0',
  },
  updateSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  levelModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  levelModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  levelModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelModalTitle: {
    color: '#1A202C',
    fontSize: 17,
    fontWeight: '900',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelAllOption: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  levelOption: {
    width: 48,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  levelOptionText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '900',
  },
  levelOptionTextActive: {
    color: '#FFFFFF',
  },
  questionItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '500',
    lineHeight: 20,
  },
  questionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  answerBox: {
    minWidth: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
    alignItems: 'flex-end',
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});
