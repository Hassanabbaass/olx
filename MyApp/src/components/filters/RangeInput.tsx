import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface Props {
  minValue: number | undefined;
  maxValue: number | undefined;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  /** Called when either bound changes. Both values are undefined when the field is cleared. */
  onChange: (min: number | undefined, max: number | undefined) => void;
  /** Fallback upper bound used when only min is set (avoids open-ended range). */
  fallbackMax?: number;
  /** Fallback lower bound used when only max is set. */
  fallbackMin?: number;
}

/**
 * Reusable min / max numeric input pair for range filters (price, mileage, year, etc.).
 * Calls onChange with (min, max); both undefined means the range is cleared.
 */
const RangeInput: React.FC<Props> = ({
  minValue,
  maxValue,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  onChange,
  fallbackMax = 999999999,
  fallbackMin = 0,
}) => {
  const handleMinChange = (text: string) => {
    const min = text ? Number(text) : undefined;
    // Only emit a range when at least one bound is set
    if (min === undefined && maxValue === undefined) {
      onChange(undefined, undefined);
    } else {
      onChange(min, maxValue ?? fallbackMax);
    }
  };

  const handleMaxChange = (text: string) => {
    const max = text ? Number(text) : undefined;
    if (max === undefined && minValue === undefined) {
      onChange(undefined, undefined);
    } else {
      onChange(minValue ?? fallbackMin, max);
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder={minPlaceholder}
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
        value={minValue !== undefined ? String(minValue) : ''}
        onChangeText={handleMinChange}
      />
      <View style={styles.separator} />
      <TextInput
        style={styles.input}
        placeholder={maxPlaceholder}
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
        value={maxValue !== undefined ? String(maxValue) : ''}
        onChangeText={handleMaxChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  separator: {
    width: 12,
    height: 1,
    backgroundColor: colors.border,
  },
});

export default RangeInput;
