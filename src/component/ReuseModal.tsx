import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextStyle,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../util';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModalState = 'confirm' | 'success' | 'failure';

export interface ReuseModalProps {
  name?: string;
  visible: boolean;
  state: ModalState;
  // Confirm state
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  // Success state
  successTitle?: string;
  successMessage?: string;
  doneLabel?: string;
  onDone?: () => void;
  // Failure state
  failureTitle?: string;
  failureMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

// ─── Icon Badge ───────────────────────────────────────────────────────────────

interface IconBadgeProps {
  state: ModalState;
}

const IconBadge: React.FC<IconBadgeProps> = ({ state }) => {
  const config = {
    confirm: {
      bg: COLORS.iconBg,
      icon: 'info-outline' as const,
      color: COLORS.primary,
    },
    success: {
      bg: COLORS.successLight,
      icon: 'check-circle' as const,
      color: COLORS.success,
    },
    failure: {
      bg: COLORS.dangerLight,
      icon: 'error' as const,
      color: COLORS.danger,
    },
  }[state];

  return (
    <View style={styles.iconWrapper}>
      {/* Decorative dots */}
      <View
        style={[
          styles.dot,
          styles.dotTopRight,
          { backgroundColor: COLORS.dot1 },
        ]}
      />
      <View
        style={[
          styles.dot,
          styles.dotBottomLeft,
          { backgroundColor: COLORS.dot2 },
        ]}
      />
      <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
        <MaterialIcons name={config.icon} size={36} color={config.color} />
      </View>
    </View>
  );
};

// ─── Confirm State ────────────────────────────────────────────────────────────

interface ConfirmViewProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const renderStyledText = (
  text: string,
  baseStyle: TextStyle | TextStyle[],
  boldStyle?: TextStyle,
): React.ReactNode => {
  const parts = text.split(/\*([^*]+)\*/g);
  // split gives: [before, boldContent, after, boldContent, after, ...]

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <Text
        key={index}
        style={[
          baseStyle,
          boldStyle ?? {
            fontWeight: '900',
            fontSize: 15,
            color: COLORS.primary,
          },
        ]}
      >
        {part}
      </Text>
    ) : (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    ),
  );
};

const ConfirmView: React.FC<ConfirmViewProps> = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => (
  <>
    <Text style={styles.title}>
      {renderStyledText(title, styles.title, {
        fontWeight: '800',
        color: COLORS.textDark,
      })}
    </Text>
    <Text style={styles.description}>
      {renderStyledText(description, styles.description)}
    </Text>
    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={onConfirm}
      activeOpacity={0.85}
    >
      <Text style={styles.primaryBtnText}>{confirmLabel}</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.cancelBtn}
      onPress={onCancel}
      activeOpacity={0.7}
    >
      <Text style={styles.cancelText}>{cancelLabel}</Text>
    </TouchableOpacity>
  </>
);
// ─── Success State ────────────────────────────────────────────────────────────

interface SuccessViewProps {
  title: string;
  message: string;
  doneLabel: string;
  onDone: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({
  title,
  message,
  doneLabel,
  onDone,
}) => (
  <>
    <Text style={[styles.title, styles.successTitle]}>{title}</Text>
    {/* <Text style={styles.description}>{message}</Text> */}
    <Text style={styles.description}>
      {renderStyledText(message, styles.description)}
    </Text>
    <TouchableOpacity
      style={[styles.primaryBtn, styles.successBtn]}
      onPress={onDone}
      activeOpacity={0.85}
    >
      <Text style={styles.primaryBtnText}>{doneLabel}</Text>
    </TouchableOpacity>
  </>
);

// ─── Failure State ────────────────────────────────────────────────────────────

interface FailureViewProps {
  title: string;
  message: string;
  onCancel: () => void;
}

const FailureView: React.FC<FailureViewProps> = ({
  title,
  message,
  onCancel,
}) => (
  <>
    <Text style={[styles.title, styles.failureTitle]}>{title}</Text>
    <Text style={styles.description}>{message}</Text>
    <TouchableOpacity
      style={styles.cancelBtn}
      onPress={onCancel}
      activeOpacity={0.7}
    >
      <Text style={styles.cancelText}>Close</Text>
    </TouchableOpacity>
  </>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const ReuseModal: React.FC<ReuseModalProps> = ({
  visible,
  state,
  title = '',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm = () => {},
  onCancel = () => {},
  doneLabel = 'Done',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <IconBadge state={state} />

          {state === 'confirm' && (
            <ConfirmView
              title={title}
              description={description}
              confirmLabel={confirmLabel}
              cancelLabel={cancelLabel}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )}

          {state === 'success' && (
            <SuccessView
              title={title}
              message={description}
              doneLabel={doneLabel}
              onDone={onCancel}
            />
          )}

          {state === 'failure' && (
            <FailureView
              title={title}
              message={description}
              onCancel={onCancel}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },

  // Icon badge
  iconWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotTopRight: {
    top: 4,
    right: 2,
  },
  dotBottomLeft: {
    bottom: 2,
    left: 4,
  },

  // Text
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  successTitle: {
    color: COLORS.success,
  },
  failureTitle: {
    color: COLORS.danger,
  },
  description: {
    fontSize: 13.5,
    color: COLORS.textMid,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  cancelBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // marginBottom: 14,
    width: '100%',
  },
  successBtn: {
    backgroundColor: COLORS.primary,
  },
  dangerBtn: {
    backgroundColor: COLORS.danger,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.textCancel,
    fontWeight: '500',
  },
});

export default ReuseModal;
