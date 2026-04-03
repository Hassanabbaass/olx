import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SearchFilters } from '../../types';
import { colors, typography, spacing } from '../../theme';

// ─── Check Icon ───────────────────────────────────────────────────────────────

const CheckIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={colors.primary}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Sort Options ─────────────────────────────────────────────────────────────

interface SortOption {
  key: SearchFilters['sortBy'];
  labelKey: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'newest',     labelKey: 'search.sortNewest'   },
  { key: 'price_asc',  labelKey: 'search.sortPriceAsc' },
  { key: 'price_desc', labelKey: 'search.sortPriceDesc' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SortModalProps {
  visible: boolean;
  currentSort: SearchFilters['sortBy'];
  onSelect: (sort: SearchFilters['sortBy']) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SortModal: React.FC<SortModalProps> = ({ visible, currentSort, onSelect, onClose }) => {
  const { t } = useTranslation();
  const activeSort = currentSort ?? 'newest';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Dimmed backdrop — tap to close */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Sheet — prevent tap from propagating to backdrop */}
        <Pressable style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>{t('search.sortBy')}</Text>

          {SORT_OPTIONS.map(option => {
            const isSelected = activeSort === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={styles.optionRow}
                onPress={() => { onSelect(option.key); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {t(option.labelKey)}
                </Text>
                {isSelected && <CheckIcon />}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: {
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: typography.fontWeights.semiBold,
    color: colors.primary,
  },
});

export default SortModal;
