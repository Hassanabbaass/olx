import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CategoryField, FieldChoice } from '../../types';
import { colors, typography, spacing } from '../../theme';
import ChipGroup from './ChipGroup';
import RangeInput from './RangeInput';
import OptionPickerModal from './OptionPickerModal';

// Fields with > CHIP_THRESHOLD choices use a modal picker instead of inline chips
const CHIP_THRESHOLD = 6;

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronRight: React.FC = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={colors.textSecondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  field: CategoryField;
  /** Current value for this field from the filter state. */
  value: string | string[] | number[] | undefined;
  /** Called with the new value. undefined = cleared. */
  onChange: (value: string | string[] | number[] | undefined) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Generic dynamic filter field renderer.
 * Maps fieldType → UI component:
 *   range / number          → RangeInput (min/max pair)
 *   select / multiselect
 *     ≤ CHIP_THRESHOLD choices → ChipGroup (inline chips)
 *     > CHIP_THRESHOLD choices → tappable row → OptionPickerModal
 *   dropdown                → tappable row → OptionPickerModal
 */
const DynamicFilterField: React.FC<Props> = ({ field, value, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // ── Range / Number ──────────────────────────────────────────────────────────
  if (field.fieldType === 'range' || field.fieldType === 'number') {
    const rangeVal = value as number[] | undefined;
    return (
      <View style={styles.section}>
        <Text style={styles.label}>{field.label}</Text>
        <RangeInput
          minValue={rangeVal?.[0]}
          maxValue={rangeVal?.[1]}
          minPlaceholder={field.min !== undefined ? String(field.min) : 'Min'}
          maxPlaceholder={field.max !== undefined ? String(field.max) : 'Max'}
          fallbackMin={field.min ?? 0}
          fallbackMax={field.max ?? 999999999}
          onChange={(min, max) => {
            if (min === undefined && max === undefined) {
              onChange(undefined);
            } else {
              onChange([min ?? field.min ?? 0, max ?? field.max ?? 999999999]);
            }
          }}
        />
      </View>
    );
  }

  const choices: FieldChoice[] = field.choices ?? [];

  // ── Inline ChipGroup (few choices) ─────────────────────────────────────────
  if (
    (field.fieldType === 'select' || field.fieldType === 'multiselect') &&
    choices.length > 0 &&
    choices.length <= CHIP_THRESHOLD
  ) {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>{field.label}</Text>
        <ChipGroup
          choices={choices}
          selected={value as string | string[] | undefined}
          isMulti={field.fieldType === 'multiselect'}
          onChange={v => onChange(v as string | string[] | undefined)}
          wrap
        />
      </View>
    );
  }

  // ── Modal picker (many choices or dropdown) ─────────────────────────────────
  if (choices.length === 0) {
    return null;
  }

  const displayValue = getDisplayValue(field, value);
  const isMulti = field.fieldType === 'multiselect';

  return (
    <>
      <TouchableOpacity
        style={styles.arrowRow}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.arrowContent}>
          <Text style={styles.label}>{field.label}</Text>
          <Text style={styles.arrowValue} numberOfLines={1}>
            {displayValue}
          </Text>
        </View>
        <ChevronRight />
      </TouchableOpacity>

      <OptionPickerModal
        visible={modalVisible}
        title={field.label}
        choices={choices}
        isMulti={isMulti}
        selected={value as string | string[] | undefined}
        onApply={v => {
          setModalVisible(false);
          onChange(v as string | string[] | undefined);
        }}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDisplayValue = (
  field: CategoryField,
  value: string | string[] | number[] | undefined,
): string => {
  if (!value) { return 'Any'; }
  if (Array.isArray(value)) {
    if (value.length === 0) { return 'Any'; }
    if (typeof value[0] === 'number') {
      return `${value[0]} – ${value[1]}`;
    }
    const labels = (value as string[]).map(v => {
      const choice = field.choices?.find(c => c.value === v);
      return choice?.label ?? v;
    });
    return labels.join(', ');
  }
  const choice = field.choices?.find(c => c.value === value);
  return choice?.label ?? String(value);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  arrowContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  arrowValue: {
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
});

export default DynamicFilterField;
