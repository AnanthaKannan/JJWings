import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleIcon = 'grid' | 'plus' | 'bolt' | 'apps';

type Module = {
  id: string;
  title: string;
  questions: number;
  iconType: ModuleIcon;
  iconBg: string;
  iconColor: string;
  iconLabel?: string; // e.g. "+1"
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: '1',
    title: 'Intro to Units & Rods',
    questions: 15,
    iconType: 'grid',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
  },
  {
    id: '2',
    title: 'Single Digit Frenzy',
    questions: 25,
    iconType: 'plus',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    iconLabel: '+1',
  },
  {
    id: '3',
    title: 'Visual Abacus Speedrun',
    questions: 10,
    iconType: 'bolt',
    iconBg: '#FEF9C3',
    iconColor: '#EAB308',
  },
  {
    id: '4',
    title: 'Quarterly Assessment A',
    questions: 50,
    iconType: 'apps',
    iconBg: '#E0E7FF',
    iconColor: '#6366F1',
  },
  {
    id: '5',
    title: 'Double Digit Mastery',
    questions: 30,
    iconType: 'bolt',
    iconBg: '#DCFCE7',
    iconColor: '#22C55E',
  },
  {
    id: '6',
    title: 'Speed Round: Level 3',
    questions: 20,
    iconType: 'grid',
    iconBg: '#FCE7F3',
    iconColor: '#EC4899',
  },
];

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
  onEdit,
  onSettings,
  onDelete,
}: {
  item: Module;
  onEdit: () => void;
  onSettings: () => void;
  onDelete: () => void;
}) => (
  <View style={styles.card}>
    {/* Top row */}
    <View style={styles.cardTop}>
      <ModuleIcon
        iconType={item.iconType}
        iconBg={item.iconBg}
        iconColor={item.iconColor}
        iconLabel={item.iconLabel}
      />
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </View>

    {/* Divider */}
    <View style={styles.cardDivider} />

    {/* Bottom row */}
    <View style={styles.cardBottom}>
      <View style={styles.questionsBadge}>
        <MaterialIcons name="quiz" size={14} color="#94A3B8" />
        <Text style={styles.questionsText}>{item.questions} Questions</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <MaterialIcons name="edit" size={18} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettings} style={styles.actionBtn}>
          <MaterialIcons name="settings" size={18} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
          <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeworkLibraryScreen() {
  const [modules, setModules] = useState<Module[]>(MODULES);

  const totalTasks = modules.reduce((sum, m) => sum + m.questions, 0);

  const handleEdit = (item: Module) => {
    // navigation.navigate('EditModule', { moduleId: item.id });
    Alert.alert('Edit', `Editing "${item.title}"`);
  };

  const handleSettings = (item: Module) => {
    Alert.alert('Settings', `Settings for "${item.title}"`);
  };

  const handleDelete = (item: Module) => {
    Alert.alert(
      'Delete Module',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setModules(prev => prev.filter(m => m.id !== item.id)),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <MaterialIcons name="menu" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homework Library</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="search" size={22} color="#1A202C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="tune" size={22} color="#1A202C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Module List ── */}
      <FlatList
        data={modules}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ModuleCard
            item={item}
            onEdit={() => handleEdit(item)}
            onSettings={() => handleSettings(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="library-books" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No modules yet</Text>
            <Text style={styles.emptySubText}>
              Tap + to add your first module
            </Text>
          </View>
        }
      />

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
});
