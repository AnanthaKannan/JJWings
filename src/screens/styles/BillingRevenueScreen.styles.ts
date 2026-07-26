import { StyleSheet } from 'react-native';

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
  shadow: '#B8C3D8',
};
export const BillingRevenueScreenStyles = StyleSheet.create({
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
