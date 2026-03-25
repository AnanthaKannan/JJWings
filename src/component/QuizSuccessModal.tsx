// src/components/SuccessModal.tsx

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────
interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onSeeResults: () => void;
  timeTaken?: string;
  accuracy?: string;
}

// ─── Component ───────────────────────────────────────────
export default function SuccessModal({
  visible,
  onClose,
  onSeeResults,
  timeTaken = '02:45',
  accuracy = '95%',
}: SuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Dim background — tap outside to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Card — stop tap propagation */}
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* ── Trophy Badge ── */}
              <View style={styles.badgeWrapper}>
                <View style={styles.badgeCircle}>
                  <Text style={styles.badgeIcon}>🏅</Text>
                </View>
                {/* Small star dot */}
                <View style={styles.starDot}>
                  <Text style={styles.starDotText}>★</Text>
                </View>
              </View>

              {/* ── Title ── */}
              <Text style={styles.title}>Successfully{'\n'}Completed!</Text>
              <Text style={styles.subtitle}>
                You've mastered the abacus{'\n'}challenge with flying colors.
              </Text>

              {/* ── Stats ── */}
              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <Text style={styles.statIconText}>🕐</Text>
                </View>
                <Text style={styles.statLabel}>Time Taken</Text>
                <Text style={styles.statValue}>{timeTaken}</Text>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <Text style={styles.statIconText}>🎯</Text>
                </View>
                <Text style={styles.statLabel}>Accuracy</Text>
                <Text style={styles.statValue}>{accuracy}</Text>
              </View>

              {/* ── See Results Button ── */}
              <TouchableOpacity
                style={styles.resultBtn}
                onPress={onSeeResults}
                activeOpacity={0.85}
              >
                <Text style={styles.resultBtnText}>See Results →</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Badge
  badgeWrapper: {
    position: 'absolute',
    top: -48,
    alignItems: 'center',
  },
  badgeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5D94A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#fff',
    shadowColor: '#D4B800',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  badgeIcon: {
    fontSize: 42,
  },
  starDot: {
    position: 'absolute',
    top: 0,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5B97A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  starDotText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '800',
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A3A6B',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A96B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '500',
  },

  // Stat Rows
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  statIconText: {
    fontSize: 18,
  },
  statLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2259',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A6CF7',
  },

  // Button
  resultBtn: {
    width: '100%',
    backgroundColor: '#1A3A6B',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    elevation: 6,
    shadowColor: '#1A3A6B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  resultBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
