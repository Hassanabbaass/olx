import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { FieldChoice } from '../../types';
import { colors, typography, spacing } from '../../theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RadioOn: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth={2} />
    <Circle cx="12" cy="12" r="6" fill={colors.primary} />
  </Svg>
);

const RadioOff: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={colors.border} strokeWidth={2} />
  </Svg>
);

const CheckboxOn: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
      fill={colors.primary}
    />
    <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckboxOff: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
      stroke={colors.border}
      strokeWidth={2}
      fill="none"
    />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  title: string;
  choices: FieldChoice[];
  isMulti: boolean;
  /** For single-select: string. For multi-select: string[]. Pass undefined for "any". */
  selected: string | string[] | undefined;
  onApply: (value: string | string[] | undefined) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OptionPickerModal: React.FC<Props> = ({
  visible,
  title,
  choices,
  isMulti,
  selected,
  onApply,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  // Normalise to array internally
  const selectedArr: string[] = Array.isArray(selected)
    ? selected
    : selected !== undefined
    ? [selected]
    : [];

  const [localSelected, setLocalSelected] = useState<string[]>(selectedArr);

  // Reset local state when modal opens with new value
  React.useEffect(() => {
    if (visible) {
      setLocalSelected(
        Array.isArray(selected) ? selected : selected !== undefined ? [selected] : [],
      );
      setQuery('');
    }
  }, [visible, selected]);

  const filtered = query.trim()
    ? choices.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : choices;

  const toggleItem = (value: string) => {
    if (isMulti) {
      setLocalSelected(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
      );
    } else {
      // Single select: apply immediately
      const newVal = localSelected[0] === value ? undefined : value;
      onApply(newVal);
    }
  };

  const handleApply = () => {
    onApply(localSelected.length === 0 ? undefined : localSelected);
  };

  const handleClear = () => {
    if (isMulti) {
      setLocalSelected([]);
    } else {
      onApply(undefined);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.headerBtn}>
            <CloseIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={handleClear} hitSlop={8} style={styles.headerBtn}>
            <Text style={styles.clearText}>{t('common.clearAll')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search (only if many choices) */}
        {choices.length > 8 && (
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={t('search.searchPlaceholder')}
              placeholderTextColor={colors.placeholder}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        )}

        {/* Options list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = localSelected.includes(item.value);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => toggleItem(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowText, isSelected && styles.rowTextSelected]} numberOfLines={1}>
                  {item.label}
                </Text>
                {isMulti
                  ? (isSelected ? <CheckboxOn /> : <CheckboxOff />)
                  : (isSelected ? <RadioOn /> : <RadioOff />)
                }
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            </View>
          }
        />

        {/* Apply button — only for multi-select */}
        {isMulti && (
          <View style={[styles.applyBar, { paddingBottom: insets.bottom + spacing.sm }]}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>
                {localSelected.length > 0
                  ? `${t('common.apply')} (${localSelected.length})`
                  : t('common.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  clearText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  searchBox: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    height: 40,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  rowTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.base,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.textSecondary,
  },
  applyBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semiBold,
  },
});

export default OptionPickerModal;
