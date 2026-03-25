import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ─── Types ───────────────────────────────────────────────
interface NumberPadProps {
  onSubmit?: (value: number) => void;
}

// ─── Component ───────────────────────────────────────────
export default function NumPad({ onSubmit }: NumberPadProps) {
  const [input, setInput] = useState('');

  const handlePress = (val: string) => {
    setInput(prev => prev + val);
  };

  const handleClear = () => {
    setInput('');
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    setInput('');
    if (onSubmit) onSubmit(Number(input));
    console.log('Submitted:', input);
  };

  // ─── Pad Layout ─────────────────────────────────────────
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'back'],
  ];

  const renderKey = (key: string, index: number) => {
    if (key === 'clear') {
      return (
        <TouchableOpacity
          key={index}
          style={[styles.key, styles.clearKey]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Text style={[styles.keyText, styles.clearText]}>Clear</Text>
        </TouchableOpacity>
      );
    }

    if (key === 'back') {
      return (
        <TouchableOpacity
          key={index}
          style={[styles.key, styles.backKey]}
          onPress={handleBackspace}
          activeOpacity={0.7}
        >
          {/* Backspace icon using unicode */}
          <Text style={[styles.keyText, styles.backText]}>⌫</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.key}
        onPress={() => handlePress(key)}
        activeOpacity={0.7}
      >
        <Text style={styles.keyText}>{key}</Text>
      </TouchableOpacity>
    );
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {/* Display Input */}
      {/* <View style={styles.displayBox}>
        <Text style={styles.displayText}>{input || '—'}</Text>
      </View> */}

      <View style={styles.resultContainer}>
        <Text style={styles.label}>YOUR ANSWER</Text>
        <Text style={styles.value}>{input || '_'}</Text>
      </View>

      {/* Number Pad */}
      <View style={styles.pad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, keyIndex) => renderKey(key, keyIndex))}
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, !input && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!input}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>Submit Answer ✓</Text>
      </TouchableOpacity>
    </View>
    // </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
    // paddingHorizontal: 24,
  },

  // Pad
  pad: {
    width: '100%',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Keys
  key: {
    flex: 1,
    marginHorizontal: 6,
    aspectRatio: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B0BADF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2259',
  },

  // Clear key
  clearKey: {
    backgroundColor: '#FADADD',
    shadowColor: '#F4A0A8',
  },
  clearText: {
    color: '#D9344A',
    fontSize: 16,
  },

  // Backspace key
  backKey: {
    backgroundColor: '#DDE3F5',
    shadowColor: '#A0AEDF',
  },
  backText: {
    color: '#3A4A8A',
    fontSize: 20,
  },

  // Submit button
  submitBtn: {
    width: '100%',
    backgroundColor: '#1A3A6B',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#1A3A6B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitDisabled: {
    backgroundColor: '#A0AECC',
    shadowOpacity: 0.1,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // result
  resultContainer: {
    backgroundColor: '#D6E8FB',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#89B8F0',
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A90D9',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A2259',
  },
});
