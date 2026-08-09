import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';

type TFilter<T> = {
  value: T;
  label: string;
};

interface FilterProps<T> {
  filters: TFilter<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

const Filter = <T extends string>({
  filters,
  selected,
  onSelect,
}: FilterProps<T>) => {
  return (
    <View style={styles.typeFilterRow}>
      {filters.map(filter => {
        const isSelected = selected === filter.value;

        return (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              isSelected && styles.filterButtonActive,
            ]}
            activeOpacity={0.85}
            onPress={() => onSelect(filter.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                isSelected && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  typeFilterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
  },
  filterButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});

export default Filter;
