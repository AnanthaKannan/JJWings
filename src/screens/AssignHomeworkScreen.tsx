import React, { useState } from 'react';
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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// ─── Types ────────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  code: string; // e.g. "5A"
  taskId: string; // e.g. "Task 5A-04"
  level: number;
  description: string;
  badge?: string; // e.g. "Next Level Preview"
  badgeColor?: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ALL_TASKS: Task[] = [
  {
    id: '1',
    code: '5A',
    taskId: 'Task 5A-04',
    level: 5,
    description: 'Advanced Addition: 3-Digit Strings',
  },
  {
    id: '2',
    code: '5A',
    taskId: 'Task 5A-05',
    level: 5,
    description: 'Mental Math: Visualization Focus',
  },
  {
    id: '3',
    code: '5A',
    taskId: 'Task 5A-06',
    level: 5,
    description: 'Subtraction: Borrowing Principles',
  },
  {
    id: '4',
    code: '5A',
    taskId: 'Task 5A-07',
    level: 5,
    description: 'Speed Challenge: Rapid Fire Addition',
  },
  {
    id: '5',
    code: '5B',
    taskId: 'Task 5B-01',
    level: 5,
    description: 'Intro to 4-Digit Addition',
    badge: 'Next Level Preview',
    badgeColor: '#F59E0B',
  },
  {
    id: '6',
    code: '5B',
    taskId: 'Task 5B-02',
    level: 5,
    description: 'Double Borrowing Subtraction',
  },
  {
    id: '7',
    code: '6A',
    taskId: 'Task 6A-01',
    level: 6,
    description: 'Large Number Addition Sprint',
  },
];

// ─── Level Badge ──────────────────────────────────────────────────────────────

const LevelBadge = ({ level }: { level: number }) => (
  <View style={styles.levelBadge}>
    <Text style={styles.levelBadgeText}>Level {level}</Text>
  </View>
);

// ─── Extra Badge ──────────────────────────────────────────────────────────────

const ExtraBadge = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.extraBadge, { backgroundColor: color + '22' }]}>
    <Text style={[styles.extraBadgeText, { color }]}>{label}</Text>
  </View>
);

// ─── Task Row ─────────────────────────────────────────────────────────────────

const TaskRow = ({
  item,
  selected,
  onToggle,
}: {
  item: Task;
  selected: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    style={[styles.taskRow, selected && styles.taskRowSelected]}
    onPress={onToggle}
    activeOpacity={0.75}
  >
    {/* Module code pill */}
    <View style={[styles.codePill, selected && styles.codePillSelected]}>
      <Text style={[styles.codeText, selected && styles.codeTextSelected]}>
        {item.code}
      </Text>
    </View>

    {/* Content */}
    <View style={styles.taskContent}>
      <View style={styles.taskTitleRow}>
        <Text style={styles.taskId}>{item.taskId}</Text>
        <LevelBadge level={item.level} />
        {item.badge && (
          <ExtraBadge label={item.badge} color={item.badgeColor ?? '#F59E0B'} />
        )}
      </View>
      <Text style={styles.taskDesc} numberOfLines={2}>
        {item.description}
      </Text>
    </View>

    {/* Checkbox */}
    <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
      {selected ? (
        <View style={styles.checkboxChecked}>
          <MaterialIcons name="check" size={14} color="#fff" />
        </View>
      ) : (
        <View style={styles.checkboxUnchecked} />
      )}
    </TouchableOpacity>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AssignHomeworkScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [_showFilters, setShowFilters] = useState(false);
  const studentName = route?.params?.studentName ?? 'Student';

  const filtered = ALL_TASKS.filter(
    t =>
      t.taskId.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(filtered.map(t => t.id));
    const allSelected = filtered.every(t => selectedIds.has(t.id));
    setSelectedIds(allSelected ? new Set() : allIds);
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0) return;
    const names = ALL_TASKS.filter(t => selectedIds.has(t.id))
      .map(t => t.taskId)
      .join(', ');
    Alert.alert(
      'Assignment Confirmed',
      `Assigned to ${studentName}:\n${names}`,
      [{ text: 'Done', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homework Lab</Text>
        <View style={styles.avatar} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* ── Breadcrumb ── */}
              <View style={styles.breadcrumb}>
                <Text style={styles.breadcrumbItem}>Students</Text>
                <MaterialIcons name="chevron-right" size={14} color="#94A3B8" />
                <Text style={styles.breadcrumbItem}>{studentName}</Text>
                <MaterialIcons name="chevron-right" size={14} color="#94A3B8" />
                <Text style={[styles.breadcrumbItem, styles.breadcrumbActive]}>
                  Assign Tasks
                </Text>
              </View>

              {/* ── Page Title ── */}
              <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>
                  Assign Homework{'\n'}to{' '}
                  <Text style={styles.pageTitleAccent}>{studentName}</Text>
                </Text>
                <Text style={styles.pageSubtitle}>
                  Select advanced soroban tasks from the master library for this
                  student.
                </Text>
              </View>

              {/* ── Search ── */}
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search tasks (e.g. 5A-04, Addition)"
                  placeholderTextColor="#B0B8C8"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialIcons name="close" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Filter Button ── */}
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setShowFilters(v => !v)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="tune" size={16} color="#4F46E5" />
                <Text style={styles.filterBtnText}>Filters</Text>
              </TouchableOpacity>

              {/* ── Available Tasks header ── */}
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Available</Text>
                  <Text style={styles.sectionTitle}>Tasks</Text>
                </View>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeNum}>{filtered.length}</Text>
                  <Text style={styles.totalBadgeLabel}>Total</Text>
                </View>
                <TouchableOpacity
                  onPress={selectAll}
                  style={styles.selectAllBtn}
                >
                  <Text style={styles.selectAllText}>
                    {filtered.every(t => selectedIds.has(t.id))
                      ? 'Deselect All'
                      : 'Select All in Module\n5A'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TaskRow
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleSelect(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={40} color="#CBD5E0" />
              <Text style={styles.emptyText}>No tasks match your search</Text>
            </View>
          }
        />

        {/* ── Footer ── */}
        {selectedIds.size > 0 && (
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>SELECTION</Text>
              <Text style={styles.footerCount}>
                {selectedIds.size} Task{selectedIds.size > 1 ? 's' : ''}{' '}
                Selected
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>Confirm{'\n'}Assignment</Text>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color="#fff"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>
        )}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C4B5D6',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 10,
  },
  breadcrumbItem: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  breadcrumbActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },

  // Title
  titleSection: { marginBottom: 18 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  pageTitleAccent: {
    color: '#4F46E5',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 19,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A202C',
    padding: 0,
  },

  // Filters
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 30,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 20,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 20,
  },
  totalBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  totalBadgeNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 16,
  },
  totalBadgeLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#C7D2FE',
    letterSpacing: 0.5,
  },
  selectAllBtn: { marginLeft: 'auto' as any },
  selectAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    textAlign: 'right',
    lineHeight: 15,
  },

  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskRowSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  codePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codePillSelected: {
    backgroundColor: '#4F46E5',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  codeTextSelected: {
    color: '#fff',
  },
  taskContent: { flex: 1 },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 3,
  },
  taskId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
  },
  taskDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  // Level badge
  levelBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Extra badge
  extraBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  extraBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Checkbox
  checkbox: { marginLeft: 10 },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  footerLeft: { flex: 1 },
  footerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  footerCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A202C',
    marginTop: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
});
