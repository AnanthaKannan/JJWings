import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../screens/theme';

interface NumberPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const DIGIT_ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function NumberPad({
  onDigit,
  onBackspace,
  onSubmit,
  disabled,
}: NumberPadProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pad}>
        {DIGIT_ROWS.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map(digit => (
              <TouchableOpacity
                key={digit}
                style={styles.key}
                activeOpacity={0.7}
                disabled={disabled}
                onPress={() => onDigit(digit)}
              >
                <Text style={styles.keyText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.key, styles.wideKey, styles.backspaceKey]}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={onBackspace}
          >
            <Text style={styles.keyText}>⌫</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.key}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={() => onDigit('0')}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.key, styles.wideKey, styles.goKey]}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={onSubmit}
          >
            <Text style={styles.goText}>GO ✅</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  pad: {
    width: '88%',
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  key: {
    flex: 1,
    marginHorizontal: 3,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  wideKey: {
    flex: 1.4,
  },
  backspaceKey: {
    backgroundColor: '#FFD7D7',
  },
  goKey: {
    backgroundColor: COLORS.success,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  goText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
