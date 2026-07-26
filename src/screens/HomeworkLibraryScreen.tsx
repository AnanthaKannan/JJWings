import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
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
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  AdminHeader,
  BottomLodeMore,
  EmptyData,
  FloatingAddButton,
  LoadingOverlay,
} from '../component';
import {
  useDeleteQuestionMutation,
  useGetQuestionsQuery,
  useUpdateQuestionMutation,
} from '../store/api';
import { HomeworkLibraryScreenStyles as styles } from './styles/HomeworkLibraryScreen.styles';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleIcon = 'grid' | 'plus' | 'bolt' | 'apps';

type Module = {
  id: string;
  title: string;
  questions: string[];
  marks?: number[];
  iconType: ModuleIcon;
  iconBg: string;
  iconColor: string;
  iconLabel?: string;
  level?: number;
  updatedAt?: string;
};

type LibraryTypeFilter = 'homework' | 'practice' | 'exam';

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

const getTaskTypeLabel = (type: LibraryTypeFilter) => {
  if (type === 'exam') return 'Exam';
  if (type === 'practice') return 'Practice';
  return 'Homework';
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
                <MaterialIcons name="school" size={14} color="#64748B" />
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
              style={[
                styles.updateButton,
                isUpdating && styles.actionButtonOff,
              ]}
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
              style={[
                styles.deleteButton,
                isDeleting && styles.actionButtonOff,
              ]}
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
  const flatListRef = useRef<FlatList<any>>(null);
  const navigation = useNavigation<any>();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<LibraryTypeFilter>('homework');
  const [page, setPage] = useState(1);
  const {
    data: questionsData,
    currentData,
    refetch,
    isLoading,
    isFetching,
  } = useGetQuestionsQuery(
    {
      type: typeFilter,
      ...(selectedLevel === null ? {} : { level: selectedLevel }),
      page,
    },
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

  useEffect(() => {
    setPage(1);
  }, [typeFilter, selectedLevel]);

  const activeQuestions = useMemo(
    () => questionsData?.questions ?? currentData?.questions ?? [],
    [currentData?.questions, questionsData?.questions],
  );

  const modules = useMemo(() => {
    if (activeQuestions.length === 0) return [];

    return activeQuestions.map((q, index) => ({
      id: q.id,
      title: q.questionId ?? q.id,
      questions: q.question,
      marks: q.marks,
      level: q.level,
      updatedAt: q.updatedAt,
      ...ICON_COLORS[index % ICON_COLORS.length],
    }));
  }, [activeQuestions]);

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
  const selectedTypeLabel = getTaskTypeLabel(typeFilter).toLowerCase();
  const selectedTypeDisplayLabel = getTaskTypeLabel(typeFilter);
  const showLoader = isFocused && isFetching && page === 1;
  const isLoadingMore = isFetching && !isLoading && page > 1;
  const hasMorePages = questionsData?.meta.hasNextPage === true;

  const handleTypeFilterPress = (type: LibraryTypeFilter) => {
    setTypeFilter(type);
    setSearchTerm('');
    setSelectedModule(null);
    setModalVisible(false);
    setPage(1);
  };

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

  const goToTop = () => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  const onRefresh = async () => {
    goToTop();
    if (page === 1) {
      await refetch();
    } else {
      setPage(1);
    }
  };
  // console.log('isFetching', isFetching, 'isLoading', isLoading);
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
      onRefresh();
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
              onRefresh();
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
      <AdminHeader header="Homework Library" headerBackgroundColor="#EEF0F8" />
      <View style={styles.headerGap} />
      <View style={styles.searchFilterRow}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={`Search ${selectedTypeLabel}`}
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
            color={selectedLevel === null ? '#64748B' : '#475569'}
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
      <View style={styles.typeFilterRow}>
        {(['homework', 'practice', 'exam'] as LibraryTypeFilter[]).map(type => {
          const isSelected = typeFilter === type;
          const label = getTaskTypeLabel(type);

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeFilterButton,
                isSelected && styles.typeFilterButtonActive,
              ]}
              onPress={() => {
                handleTypeFilterPress(type);
                goToTop();
              }}
              activeOpacity={0.82}
            >
              <Text
                style={[
                  styles.typeFilterText,
                  isSelected && styles.typeFilterTextActive,
                ]}
                numberOfLines={1}
              >
                {label} {isSelected ? questionsData?.meta?.total || 0 : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FlatList
        data={showLoader ? [] : filteredModules}
        ref={flatListRef}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!showLoader && !isLoadingMore && hasMorePages) {
            setPage(prev => prev + 1);
          }
        }}
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
          <EmptyData
            showLoader={showLoader}
            loadingMessage={`Loading ${selectedTypeLabel}...`}
            emptyTitle={
              searchTerm
                ? `No ${selectedTypeLabel} found`
                : `No ${selectedTypeLabel} yet`
            }
            emptyText={
              searchTerm
                ? 'Try searching another task or question'
                : `${selectedTypeDisplayLabel} will appear here when created`
            }
            icon="library-books"
          />
        }
        ListFooterComponent={
          <BottomLodeMore loading={questionsData?.meta.hasNextPage} />
        }
      />

      <FloatingAddButton onPress={() => navigation.navigate('CreateNewTask')} />
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
                    {typeFilter === 'exam' &&
                    typeof selectedModule?.marks?.[idx] === 'number' ? (
                      <View style={styles.markBadge}>
                        <Text style={styles.markText}>
                          {selectedModule.marks[idx]} pts
                        </Text>
                      </View>
                    ) : null}
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
