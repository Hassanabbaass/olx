import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { RootStackParamList, Ad, SearchFilters, Category } from '../types';
import { colors, typography, spacing } from '../theme';
import useFetchAds from '../hooks/useFetchAds';
import { useAppContext } from '../store/AppContext';
import AdCard from '../components/AdCard';
import EliteAdCard from '../components/search/EliteAdCard';
import SearchHeader from '../components/search/SearchHeader';
import FilterChipsRow from '../components/search/FilterChipsRow';
import SortModal from '../components/search/SortModal';
import LoadingSkeleton from '../components/search/LoadingSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchResultsNavProp = StackNavigationProp<RootStackParamList, 'SearchResults'>;
type SearchResultsRouteProp = RouteProp<RootStackParamList, 'SearchResults'>;

interface Props {
  navigation: SearchResultsNavProp;
  route: SearchResultsRouteProp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findCategoryByExternalID = (
  categories: Category[],
  externalID: string,
): Category | null => {
  for (const cat of categories) {
    if (cat.externalID === externalID) { return cat; }
    if (cat.children?.length) {
      const found = findCategoryByExternalID(cat.children, externalID);
      if (found) { return found; }
    }
  }
  return null;
};

// ─── Sort Icon ────────────────────────────────────────────────────────────────

const SortIcon: React.FC = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M7 12h10M11 18h2"
      stroke={colors.textPrimary}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const SearchResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { categories } = useAppContext();

  const [filters, setFilters] = useState<SearchFilters>(route.params?.filters ?? {});
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [sortVisible, setSortVisible] = useState(false);

  const { ads, total, isLoading, isLoadingMore, error, hasMore, search, loadMore } =
    useFetchAds();

  // Re-search whenever route params change (e.g. returning from SearchFiltersScreen)
  useEffect(() => {
    const newFilters = route.params?.filters ?? {};
    const newQuery = route.params?.query ?? '';
    console.log('[SearchResults] route params changed:', JSON.stringify(route.params));
    console.log('[SearchResults] searching with filters:', JSON.stringify(newFilters), '| keyword:', newQuery || newFilters.keyword || '(none)');
    setFilters(newFilters);
    setQuery(newQuery);
    search({ ...newFilters, keyword: newQuery || newFilters.keyword });
    // `search` is stable (useCallback with no deps); exclude to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const eliteAds = ads.filter(a => a.isElite).slice(0, 3);
  const regularAds = ads.filter(a => !a.isElite);

  const selectedCategory = filters.categoryID
    ? findCategoryByExternalID(categories, filters.categoryID)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const applyNewFilters = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      search({ ...newFilters, keyword: query || newFilters.keyword });
    },
    [search, query],
  );

  const handleQuerySubmit = useCallback(() => {
    console.log('[SearchResults] query submitted:', query);
    search({ ...filters, keyword: query });
  }, [search, filters, query]);

  const handleFiltersPress = () => {
    navigation.navigate('SearchFilters', {
      filters: { ...filters, keyword: query },
    });
  };

  const handleRemoveCategory = () => {
    applyNewFilters({ ...filters, categoryID: undefined });
  };

  const handleRemoveLocation = () => {
    applyNewFilters({ ...filters, locationID: undefined });
  };

  const handleSortSelect = (sortBy: SearchFilters['sortBy']) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    search({ ...newFilters, keyword: query });
  };

  // ── Sub-renders ───────────────────────────────────────────────────────────

  const renderMetaBar = () => {
    const label = selectedCategory
      ? t('search.showingCategory', {
          count: total.toLocaleString(),
          category: selectedCategory.name,
        })
      : t('search.showing', {
          count: total.toLocaleString(),
          query: query || t('search.allCountry'),
        });

    return (
      <View style={styles.metaBar}>
        <Text style={styles.metaText} numberOfLines={1}>
          {label}
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortVisible(true)}
          hitSlop={8}
        >
          <SortIcon />
          <Text style={styles.sortText}>{t('search.sortBy')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEliteSection = () => {
    if (eliteAds.length === 0) { return null; }
    return (
      <View style={styles.eliteSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('search.eliteAds')}</Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.viewMoreText}>{t('common.viewMore')} {'>'}</Text>
          </TouchableOpacity>
        </View>
        {eliteAds.map(ad => (
          <EliteAdCard key={ad.id} ad={ad} />
        ))}
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      {renderMetaBar()}
      {renderEliteSection()}
    </>
  );

  const renderFooter = () => {
    if (!isLoadingMore) { return null; }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) { return null; }
    if (error) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t('common.networkError')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => search({ ...filters, keyword: query })}
          >
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>{t('common.noResults')}</Text>
        <Text style={styles.emptyDesc}>{t('common.noResultsDesc')}</Text>
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleQuerySubmit}
        onBack={() => navigation.goBack()}
        placeholder={t('search.searchPlaceholder')}
      />

      <FilterChipsRow
        filters={filters}
        categoryName={selectedCategory?.name}
        locationName={filters.locationName}
        onFiltersPress={handleFiltersPress}
        onRemoveCategory={handleRemoveCategory}
        onRemoveLocation={handleRemoveLocation}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={regularAds}
          keyExtractor={item => item.id}
          renderItem={({ item }: { item: Ad }) => (
            <AdCard ad={item} variant="vertical" />
          )}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            regularAds.length === 0 && styles.listContentGrow,
          ]}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}

      <SortModal
        visible={sortVisible}
        currentSort={filters.sortBy}
        onSelect={handleSortSelect}
        onClose={() => setSortVisible(false)}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  listContentGrow: {
    flexGrow: 1,
  },
  eliteSection: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  viewMoreText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  metaText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: typography.fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.base,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    color: colors.surface,
    fontWeight: typography.fontWeights.semiBold,
    fontSize: typography.fontSizes.base,
  },
});

export default SearchResultsScreen;
