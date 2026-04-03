import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FieldChoice } from '../../types';
import { colors, typography, spacing } from '../../theme';

interface Props {
  choices: FieldChoice[];
  /** Single-select: string. Multi-select: string[]. undefined = nothing selected ("Any"). */
  selected: string | string[] | undefined;
  isMulti?: boolean;
  /** Called with the new value. Pass undefined to clear ("Any"). */
  onChange: (value: string | string[] | undefined) => void;
  /** Wrap chips onto multiple lines. Default false (horizontal scroll). */
  wrap?: boolean;
}

/**
 * Reusable chip group for single-select and multi-select filter fields.
 * Renders an "Any" chip followed by the given choices.
 *
 * - Single-select: tapping a chip selects it; tapping again or tapping "Any" clears.
 * - Multi-select: tapping a chip toggles it; tapping "Any" clears all.
 */
const ChipGroup: React.FC<Props> = ({ choices, selected, isMulti = false, onChange, wrap = false }) => {
  const { t } = useTranslation();
  const selectedArr: string[] = Array.isArray(selected)
    ? selected
    : selected !== undefined
    ? [selected]
    : [];

  const isAnySelected = selectedArr.length === 0;

  const handleAny = () => onChange(undefined);

  const handleChip = (value: string) => {
    if (isMulti) {
      const next = selectedArr.includes(value)
        ? selectedArr.filter(v => v !== value)
        : [...selectedArr, value];
      onChange(next.length === 0 ? undefined : next);
    } else {
      onChange(selectedArr[0] === value ? undefined : value);
    }
  };

  const chips = (
    <>
      {/* "Any" chip */}
      <TouchableOpacity
        style={[styles.chip, isAnySelected && styles.chipActive]}
        onPress={handleAny}
        activeOpacity={0.75}
      >
        <Text style={[styles.chipText, isAnySelected && styles.chipTextActive]}>{t('common.any')}</Text>
      </TouchableOpacity>

      {choices.map(choice => {
        const active = selectedArr.includes(choice.value);
        return (
          <TouchableOpacity
            key={choice.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => handleChip(choice.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {choice.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  if (wrap) {
    return <View style={styles.wrapRow}>{chips}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {chips}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chipInactive,
  },
  chipActive: {
    backgroundColor: colors.chipActive,
    borderColor: colors.chipActive,
  },
  chipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.chipInactiveText,
    fontWeight: typography.fontWeights.medium,
  },
  chipTextActive: {
    color: colors.chipActiveText,
  },
});

export default ChipGroup;
