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
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AdminHeader } from '../component';
import { useGetQuestionsQuery } from '../store/api';

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
}: {
  item: Module;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
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
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeworkLibraryScreen() {
  const { data: questionsData } = useGetQuestionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const modules = useMemo(() => {
    if (!questionsData) return [];

    return questionsData.map((q, index) => ({
      id: q.id,
      title: q.questionId ?? q.id,
      questions: q.question,
      ...ICON_COLORS[index % ICON_COLORS.length],
    }));
  }, [questionsData]);

  const handleModulePress = (item: Module) => {
    setSelectedModule(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedModule(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <AdminHeader header="Homework Library" />
      <View style={{ marginTop: 15 }}></View>
      {/* ── Module List ── */}
      <FlatList
        data={modules}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ModuleCard item={item} onPress={() => handleModulePress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="library-books" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No questions yet</Text>
            <Text style={styles.emptySubText}>
              Questions will appear here when created
            </Text>
          </View>
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

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert('Add Module', 'Navigate to add module screen')
        }
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
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
    marginBottom: 14,
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
    justifyContent: 'space-between',
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
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
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
