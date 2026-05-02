import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  name: string;
  studentId: string;
  accuracy: number;
  avgSpeed: string;
  avatar: string; // placeholder color
  level: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Leo Chen',
    studentId: 'ST-8821',
    accuracy: 98,
    avgSpeed: '0.8s',
    avatar: '#E8A87C',
    level: 'Level 5',
  },
  {
    id: '2',
    name: 'Maya Patel',
    studentId: 'ST-8792',
    accuracy: 91,
    avgSpeed: '1.2s',
    avatar: '#7EB8D4',
    level: 'Level 3',
  },
  {
    id: '3',
    name: 'Ethan Ross',
    studentId: 'ST-9104',
    accuracy: 99,
    avgSpeed: '0.6s',
    avatar: '#F4C56A',
    level: 'Level 7',
  },
  {
    id: '4',
    name: 'Priya Sharma',
    studentId: 'ST-9045',
    accuracy: 87,
    avgSpeed: '1.5s',
    avatar: '#B39DDB',
    level: 'Level 2',
  },
  {
    id: '5',
    name: 'Jake Miller',
    studentId: 'ST-8911',
    accuracy: 94,
    avgSpeed: '1.0s',
    avatar: '#80CBC4',
    level: 'Level 6',
  },
  {
    id: '6',
    name: 'Aisha Noor',
    studentId: 'ST-9230',
    accuracy: 96,
    avgSpeed: '0.9s',
    avatar: '#EF9A9A',
    level: 'Level 4',
  },
];

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({ color, name }: { color: string; name: string }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

// ─── Accuracy Badge ───────────────────────────────────────────────────────────

const AccuracyBadge = ({ value }: { value: number }) => {
  const color = value >= 95 ? '#22c55e' : value >= 85 ? '#f59e0b' : '#ef4444';
  return (
    <View style={[styles.accuracyBadge, { backgroundColor: color + '18' }]}>
      <Text style={[styles.accuracyText, { color }]}>{value}%</Text>
    </View>
  );
};

// ─── Student Row ──────────────────────────────────────────────────────────────

const StudentRow = ({
  item,
  onPress,
}: {
  item: Student;
  onPress: Function;
}) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.row}>
      <View style={styles.studentInfo}>
        <Avatar color={item.avatar} name={item.name} />
        <View style={styles.nameBlock}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentMeta}>
            #{item.studentId} · {item.level}
          </Text>
        </View>
      </View>

      <AccuracyBadge value={item.accuracy} />

      <Text style={styles.speedText}>{item.avgSpeed}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionIcon}>
          <Text style={styles.actionIconText}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionDots}>
          <Text style={styles.dotsText}>···</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Bottom Tab ───────────────────────────────────────────────────────────────

const TAB_ITEMS = [
  { label: 'Students', icon: '👤', active: true },
  { label: 'Library', icon: '📖', active: false },
  { label: 'Reports', icon: '📊', active: false },
  { label: 'Settings', icon: '⚙️', active: false },
];

const BottomTab = () => (
  <View style={styles.bottomTab}>
    {TAB_ITEMS.map(tab => (
      <TouchableOpacity key={tab.label} style={styles.tabItem}>
        <Text style={styles.tabIcon}>{tab.icon}</Text>
        <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>
          {tab.label}
        </Text>
        {tab.active && <View style={styles.tabDot} />}
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Table Header ─────────────────────────────────────────────────────────────

const TableHeader = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerText, { flex: 2.2 }]}>STUDENT</Text>
    <Text style={[styles.headerText, { flex: 1 }]}>ACCURACY</Text>
    <Text style={[styles.headerText, { flex: 0.9 }]}>AVG SPEED</Text>
    <Text style={[styles.headerText, { flex: 0.8, textAlign: 'right' }]}>
      ACTION
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StudentDirectoryScreen() {
  const [search, setSearch] = useState('');

  const navigation = useNavigation();

  const filtered = STUDENTS.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.level.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRowPress = () => {
    console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    navigation.navigate('AdminAddStudent');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>T</Text>
          </View>
          <Text style={styles.brandName}>Tactile Admin</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellButton}>
            <Text>🔔</Text>
          </TouchableOpacity>
          <View style={styles.profileCircle} />
        </View>
      </View>

      {/* Page Title */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Student Directory</Text>
        <Text style={styles.pageSubtitle}>
          Real-time overview of {STUDENTS.length * 41} enrolled students across
          12 levels.
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, level, or ID..."
          placeholderTextColor="#A0AEC0"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Table */}
      <View style={styles.tableCard}>
        <TableHeader />
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <StudentRow item={item} onPress={() => handleRowPress(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Bottom Tab */}
      <BottomTab />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FB',
  },
  menuButton: { padding: 4 },
  menuIcon: { fontSize: 18 },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brandName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellButton: { padding: 4 },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E0',
  },

  // Title
  titleSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    lineHeight: 18,
  },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#2D3748' },
  clearIcon: { fontSize: 14, color: '#A0AEC0', paddingHorizontal: 4 },

  // Table Card
  tableCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },

  // Table Header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.8,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  studentInfo: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nameBlock: { flex: 1 },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 17,
  },
  studentMeta: { fontSize: 11, color: '#A0AEC0', marginTop: 1 },

  // Accuracy
  accuracyBadge: {
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 54,
  },
  accuracyText: { fontSize: 12, fontWeight: '700' },

  // Speed
  speedText: {
    flex: 0.9,
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Actions
  actions: {
    flex: 0.8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: { fontSize: 14, color: '#4F46E5' },
  actionDots: { paddingHorizontal: 4 },
  dotsText: { fontSize: 16, color: '#CBD5E0', letterSpacing: 1 },

  // Separator
  separator: { height: 1, backgroundColor: '#F7F7FA' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#A0AEC0' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 26, lineHeight: 30 },

  // Bottom Tab
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#A0AEC0', marginTop: 3, fontWeight: '500' },
  tabLabelActive: { color: '#4F46E5', fontWeight: '700' },
  tabDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
});
