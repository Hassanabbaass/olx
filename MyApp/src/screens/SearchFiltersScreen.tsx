import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import {
  RootStackParamList,
  SearchFilters,
  Category,
  CategoryField,
  Location,
} from '../types';
import { colors, typography, spacing } from '../theme';
import { useAppContext } from '../store/AppContext';
import { fetchAdsCount } from '../api/adsApi';
import CategoryPickerModal from '../components/filters/CategoryPickerModal';
import LocationPickerModal from '../components/filters/LocationPickerModal';
import DynamicFilterField from '../components/filters/DynamicFilterField';
import RangeInput from '../components/filters/RangeInput';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'SearchFilters'>;
  route: RouteProp<RootStackParamList, 'SearchFilters'>;
};

// Dynamic field keys that have dedicated UI sections (price has its own inputs)
const SKIP_DYNAMIC_KEYS = new Set(['price']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findCategory = (cats: Category[], id: string): Category | null => {
  for (const c of cats) {
    if (c.externalID === id) { return c; }
    if (c.children?.length) {
      const found = findCategory(c.children, id);
      if (found) { return found; }
    }
  }
  return null;
};

const findParent = (cats: Category[], childID: string): Category | null => {
  for (const c of cats) {
    if (c.children?.some(ch => ch.externalID === childID)) { return c; }
    if (c.children?.length) {
      const found = findParent(c.children, childID);
      if (found) { return found; }
    }
  }
  return null;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ChevronRight: React.FC = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Small reusable pieces ────────────────────────────────────────────────────

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
  <Text style={styles.sectionTitle}>{label}</Text>
);

const Divider: React.FC = () => <View style={styles.divider} />;


// ─── Component ────────────────────────────────────────────────────────────────

const SearchFiltersScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { categories, categoryFieldsMap } = useAppContext();

  // Local copy of filters — only committed to SearchResults on "See Results"
  const [localFilters, setLocalFilters] = useState<SearchFilters>(
    route.params?.filters ?? {},
  );

  // Modal visibility
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Live result count
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const countTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedCategory = localFilters.categoryID
    ? findCategory(categories, localFilters.categoryID)
    : null;

  const parentCategory = selectedCategory
    ? findParent(categories, selectedCategory.externalID)
    : null;

  const categoryLabel = selectedCategory
    ? parentCategory
      ? `${parentCategory.name} › ${selectedCategory.name}`
      : selectedCategory.name
    : t('common.any');

  // Dynamic fields for selected category (skip dedicated sections and fields with no choices)
  const dynamicFields: CategoryField[] = selectedCategory
    ? (categoryFieldsMap[selectedCategory.externalID] ?? []).filter(
        f => !SKIP_DYNAMIC_KEYS.has(f.key),
      )
    : [];

  // ── Live count ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (countTimerRef.current) { clearTimeout(countTimerRef.current); }
    countTimerRef.current = setTimeout(async () => {
      setIsCountLoading(true);
      try {
        const count = await fetchAdsCount(localFilters);
        setResultCount(count);
      } catch {
        // keep previous count
      } finally {
        setIsCountLoading(false);
      }
    }, 600);
    return () => {
      if (countTimerRef.current) { clearTimeout(countTimerRef.current); }
    };
  }, [localFilters]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleClearAll = useCallback(() => {
    setLocalFilters({ keyword: localFilters.keyword });
  }, [localFilters.keyword]);

  const handleApply = useCallback(() => {
    navigation.navigate('SearchResults', { filters: localFilters });
  }, [navigation, localFilters]);

  const handleCategorySelect = useCallback((cat: Category | null) => {
    setCategoryModalVisible(false);
    setLocalFilters(prev => ({
      ...prev,
      categoryID: cat?.externalID,
      dynamicFields: {}, // reset dynamic fields when category changes
    }));
  }, []);

  const handleLocationSelect = useCallback((loc: Location | null) => {
    setLocationModalVisible(false);
    setLocalFilters(prev => ({
      ...prev,
      locationID: loc?.externalID,
      locationName: loc?.name,
    }));
  }, []);

  const setDynamicField = useCallback(
    (key: string, value: string | string[] | number[] | undefined) => {
      setLocalFilters(prev => {
        const next = { ...prev, dynamicFields: { ...prev.dynamicFields } };
        if (value === undefined) {
          delete next.dynamicFields![key];
        } else {
          next.dynamicFields![key] = value;
        }
        return next;
      });
    },
    [],
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
          <CloseIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('filters.title')}</Text>
        <TouchableOpacity onPress={handleClearAll} hitSlop={8} style={styles.headerBtn}>
          <Text style={styles.clearAllText}>{t('common.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scrollable sections ── */}
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Category */}
        <View style={styles.section}>
          <SectionTitle label={t('filters.category')} />
          <TouchableOpacity
            style={styles.categoryRow}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryLabel} numberOfLines={1}>{categoryLabel}</Text>
            <Text style={styles.changeText}>{t('common.change')}</Text>
          </TouchableOpacity>
        </View>
        <Divider />

        {/* Location */}
        <TouchableOpacity
          style={styles.arrowRow}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.arrowRowContent}>
            <SectionTitle label={t('filters.location')} />
            <Text style={styles.arrowRowValue}>
              {localFilters.locationName ?? t('filters.lebanon')}
            </Text>
          </View>
          <ChevronRight />
        </TouchableOpacity>
        <Divider />

        {/* Price */}
        <View style={styles.section}>
          <SectionTitle label={t('filters.price')} />
          <RangeInput
            minValue={localFilters.priceMin}
            maxValue={localFilters.priceMax}
            minPlaceholder={t('filters.priceMin')}
            maxPlaceholder={t('filters.priceMax')}
            onChange={(min, max) =>
              setLocalFilters(prev => ({ ...prev, priceMin: min, priceMax: max }))
            }
          />
        </View>
        <Divider />

        {/* Dynamic fields (category-specific) */}
        {dynamicFields.map(field => (
          <React.Fragment key={field.key}>
            <DynamicFilterField
              field={field}
              value={localFilters.dynamicFields?.[field.key]}
              onChange={v => setDynamicField(field.key, v)}
            />
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>

      {/* ── See Results button ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          {isCountLoading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.applyText}>
              {resultCount !== null
                ? t('filters.seeResults', { count: resultCount.toLocaleString() })
                : t('common.apply')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <CategoryPickerModal
        visible={categoryModalVisible}
        categories={categories}
        selectedID={localFilters.categoryID}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryModalVisible(false)}
      />

      <LocationPickerModal
        visible={locationModalVisible}
        selectedID={localFilters.locationID}
        onSelect={handleLocationSelect}
        onClose={() => setLocationModalVisible(false)}
      />

    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    minWidth: 64,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  clearAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  scroll: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // Category row
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLabel: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
    marginRight: spacing.sm,
  },
  changeText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },

  // Arrow row (location, dynamic select fields)
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  arrowRowContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  arrowRowValue: {
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },

  // Footer / apply button
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  applyText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
});

export default SearchFiltersScreen;
