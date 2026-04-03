import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SearchFilters } from '../../types';
import { colors, typography, spacing } from '../../theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const FilterIcon: React.FC = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="18" x2="14" y2="18" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ChevronDown: React.FC = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={colors.textSecondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon: React.FC = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={colors.textSecondary}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilterChipsRowProps {
  filters: SearchFilters;
  categoryName?: string;
  locationName?: string;
  onFiltersPress: () => void;
  onRemoveCategory: () => void;
  onRemoveLocation: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const FilterChipsRow: React.FC<FilterChipsRowProps> = ({
  filters,
  categoryName,
  locationName,
  onFiltersPress,
  onRemoveCategory,
  onRemoveLocation,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Filters Button */}
      <TouchableOpacity
        style={styles.filtersButton}
        onPress={onFiltersPress}
        activeOpacity={0.8}
      >
        <FilterIcon />
        <Text style={styles.filtersButtonText}>{t('search.filters')}</Text>
      </TouchableOpacity>

      {/* Scrollable Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsList}
      >
        {/* Location chip — shows locationName if a location is selected, "All country" otherwise */}
        {filters.locationID && locationName ? (
          <TouchableOpacity
            style={styles.chip}
            onPress={onRemoveLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>{locationName}</Text>
            <CloseIcon />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.chip}
            onPress={onFiltersPress}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>{t('search.allCountry')}</Text>
            <ChevronDown />
          </TouchableOpacity>
        )}

        {/* Category chip — only visible when a category is active */}
        {filters.categoryID && categoryName && (
          <TouchableOpacity
            style={styles.chip}
            onPress={onRemoveCategory}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>{categoryName}</Text>
            <CloseIcon />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  filtersButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.surface,
  },
  chipsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
});

export default FilterChipsRow;
