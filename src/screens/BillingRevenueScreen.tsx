import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

import { AdminHeader } from '../component';
import { BillingRevenueScreenStyles as styles } from './styles/BillingRevenueScreen.styles';

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

export default BillingRevenueScreen;
