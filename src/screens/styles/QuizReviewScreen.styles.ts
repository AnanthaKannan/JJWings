import { StyleSheet } from 'react-native';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF4FF';
const RED = '#EF4444';
const RED_LIGHT = '#FEF2F2';
const GREEN = '#22C55E';
const TEXT = '#1E293B';
const MUTED = '#64748B';
export const QuizReviewScreenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomSpacer: {
    height: 32,
  },
  loaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: BLUE,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroStatsLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  statBlock: {
    flex: 1,
    minWidth: 0,
  },
  timeStatBlock: {
    flex: 0,
    minWidth: 92,
    alignItems: 'flex-end',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
    marginBottom: 14,
  },
  scorePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  scorePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  timerRow: {
    alignItems: 'flex-end',
    minWidth: 92,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 54,
  },
  timerShow: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0,
    lineHeight: 54,
    minWidth: 92,
    textAlign: 'right',
  },
  scoreSubText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '800',
    marginTop: -4,
  },
  scoreTotal: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  timeTakenCard: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeTakenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeTakenValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  trophyContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  trophyEmoji: {
    fontSize: 36,
  },

  // Section
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardWrong: {
    backgroundColor: RED_LIGHT,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  wrongBadge: {
    backgroundColor: RED,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  wrongBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  abacusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abacusIconWrong: {
    backgroundColor: '#FEE2E2',
  },
  abacusEmoji: {
    fontSize: 22,
  },

  questionArea: {
    flex: 1,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  pointsBadge: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 7,
  },
  pointsText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.5,
  },
  questionTextWrong: {
    color: RED,
  },

  answerArea: {
    alignItems: 'flex-end',
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  answerLabelWrong: {
    color: '#EF4444',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerValue: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
  },
  answerValueWrong: {
    color: RED,
  },

  // Check / Cross
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  crossIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Tip row
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  showMeBtn: {
    backgroundColor: RED,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  showMeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
