import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

import { AdminHeader } from '../component';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BillingData {
  totalStudents: number;
  perStudentCost: number;
  expectedMonthlyBilling: number;
  date: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BILLING_DATA: BillingData = {
  totalStudents: 10,
  perStudentCost: 19,
  expectedMonthlyBilling: 190,
  date: 'June 15, 2024',
};

const COLORS = {
  background: '#EEF1F8',
  cardBlue: '#DAE2F5',
  cardOrange: '#FAD99C',
  primaryBlue: '#0D3B6E',
  accentBlue: '#1A5FA8',
  green: '#2E9E5B',
  orange: '#8B5E00',
  progressBar: '#1A5FA8',
  progressBg: '#B8CAEB',
  navActive: '#1A5FA8',
  navInactive: '#9AA3B2',
  navActiveBg: '#DAE2F5',
  fabBg: '#7A3B00',
  white: '#FFFFFF',
  textMuted: '#6B7280',
};

const StudentCard: React.FC<{
  total: number;
}> = ({ total }) => (
  <View style={[styles.card, styles.cardBlueBg]}>
    <Text style={styles.cardLabel}>TOTAL STUDENTS</Text>
    <View style={styles.statRow}>
      <Text style={styles.bigNumber}>{total}</Text>
    </View>
  </View>
);

const CostCard: React.FC<{
  cost: number;
}> = ({ cost }) => (
  <View style={[styles.card, styles.cardOrangeBg]}>
    <Text style={[styles.cardLabel, styles.orangeLabel]}>PER STUDENT COST</Text>
    <View style={styles.statRow}>
      <Text style={styles.bigNumberOrange}>₹{cost.toFixed(0)}</Text>
      <Text style={styles.perMonth}> /mo</Text>
    </View>
  </View>
);

const LastDate: React.FC<{
  title: string;
  lastDate: string;
  showTest: boolean;
}> = ({ lastDate, title, showTest }) => (
  <View style={[styles.card, styles.cardOrangeBg]}>
    <Text style={[styles.cardLabel, styles.orangeLabel]}>{title}</Text>
    <View style={styles.statRow}>
      <Text style={styles.perMonth}>{lastDate}</Text>
    </View>
    {showTest && (
      <Text style={styles.description}>
        Please contact this email id for the bill payment details
      </Text>
    )}
  </View>
);

const BillingCard: React.FC<{
  amount: number;
}> = ({ amount }) => (
  <View style={[styles.card, styles.cardBlueBg]}>
    <Text style={styles.cardLabel}>JUNE MONTHLY BILLING</Text>
    <Text style={styles.bigBilling}>
      ₹{amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
    </Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const BillingRevenueScreen: React.FC = () => {
  const { totalStudents, perStudentCost, expectedMonthlyBilling, date } =
    BILLING_DATA;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader header="Billing" headerBackgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <StudentCard total={totalStudents} />
          <CostCard cost={perStudentCost} />
        </View>

        <BillingCard amount={expectedMonthlyBilling} />
        <LastDate
          title="LAST DATE FOR BILL PAYMENT"
          lastDate={date}
          showTest={false}
        />
        <LastDate
          title="Contact"
          lastDate={'sreeananthakannan@gmail.com'}
          showTest={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    marginTop: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryBlue,
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryBlue,
  },

  // Cards
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cardBlueBg: {
    backgroundColor: COLORS.cardBlue,
  },
  cardOrangeBg: {
    backgroundColor: COLORS.cardOrange,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryBlue,
    letterSpacing: 1.2,
    marginBottom: 8,
    opacity: 0.7,
  },
  orangeLabel: {
    color: COLORS.orange,
  },

  // Numbers
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bigNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.primaryBlue,
    lineHeight: 58,
  },
  bigNumberSuffix: {
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.accentBlue,
    marginBottom: 6,
  },
  bigNumberOrange: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.orange,
    lineHeight: 54,
  },
  perMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 6,
  },
  bigBilling: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.primaryBlue,
    letterSpacing: -1,
  },

  // Text variants
  growthText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.orange,
  },

  // Progress bar
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.progressBar,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentBlue,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.fabBg,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 32,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingBottom: 16,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  navItemActive: {
    backgroundColor: COLORS.navActiveBg,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.navInactive,
  },
  navLabelActive: {
    color: COLORS.navActive,
    fontWeight: '700',
  },
});

export default BillingRevenueScreen;
