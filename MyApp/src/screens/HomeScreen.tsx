import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { RootStackParamList, Ad, Category } from '../types';
import { colors, typography, spacing } from '../theme';
import { fetchAds } from '../api/adsApi';
import useCategories from '../hooks/useCategories';
import LocationHeader from '../components/home/LocationHeader';
import BannerCarousel from '../components/home/BannerCarousel';
import CategoriesRow from '../components/home/CategoriesRow';
import AdSectionRow from '../components/home/AdSectionRow';

type HomeNavProp = StackNavigationProp<RootStackParamList>;

// ─── Home sections ────────────────────────────────────────────────────────────
// externalIDs confirmed from olx.com.lb/api/categories response:
//   Cars for Sale  → externalID "23"  (child of Vehicles, id:1 extID:129)
//   Properties     → externalID "138" (root Properties category, id:2)
const HOME_SECTIONS = [
  { titleKey: 'home.carsForSale',             categoryID: '23'  },
  { titleKey: 'home.internationalProperties', categoryID: '138' },
];

const PAGE_SIZE = 6;

// ─── Search Icon ──────────────────────────────────────────────────────────────

const SearchIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={colors.placeholder} strokeWidth={1.8} />
    <Path
      d="M16.5 16.5L21 21"
      stroke={colors.placeholder}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { categories, isLoading: categoriesLoading } = useCategories();

  const [sectionAds, setSectionAds] = useState<Record<string, Ad[]>>({});
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadSectionAds = useCallback(async () => {
    const loadings: Record<string, boolean> = {};
    HOME_SECTIONS.forEach(s => { loadings[s.categoryID] = true; });
    setSectionLoading(loadings);

    const results = await Promise.allSettled(
      HOME_SECTIONS.map(section =>
        fetchAds(0, PAGE_SIZE, { categoryID: section.categoryID }),
      ),
    );

    const newAds: Record<string, Ad[]> = {};
    const newLoadings: Record<string, boolean> = {};
    results.forEach((result, idx) => {
      const id = HOME_SECTIONS[idx].categoryID;
      newAds[id] = result.status === 'fulfilled' ? result.value.ads : [];
      newLoadings[id] = false;
    });

    setSectionAds(newAds);
    setSectionLoading(newLoadings);
  }, []);

  useEffect(() => {
    loadSectionAds();
  }, [loadSectionAds]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSectionAds();
    setRefreshing(false);
  }, [loadSectionAds]);

  const handleSearchPress = () => {
    navigation.navigate('SearchResults', { query: '', filters: {} });
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('SearchResults', {
      filters: { categoryID: category.externalID },
    });
  };

  const handleSeeAll = (categoryID: string) => {
    navigation.navigate('SearchResults', { filters: { categoryID } });
  };

  const handleAdPress = (ad: Ad) => {
    navigation.navigate('SearchResults', {
      filters: { categoryID: ad.category.externalID },
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Sticky Header */}
      <View style={styles.header}>
        <LocationHeader location="Lebanon" />
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.85}
        >
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.placeholder}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <BannerCarousel />

        {/* Browse Categories */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{t('home.browseCategories')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchResults', { filters: {} })}
              hitSlop={8}
            >
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <CategoriesRow
            categories={categories}
            isLoading={categoriesLoading}
            onCategoryPress={handleCategoryPress}
          />
        </View>

        {/* Ad Sections */}
        {HOME_SECTIONS.map(section => (
          <AdSectionRow
            key={section.categoryID}
            title={t(section.titleKey)}
            ads={sectionAds[section.categoryID] ?? []}
            isLoading={sectionLoading[section.categoryID] ?? false}
            onSeeAll={() => handleSeeAll(section.categoryID)}
            onAdPress={handleAdPress}
          />
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  scroll: {
    flex: 1,
  },
  sectionBlock: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  bottomPad: {
    height: spacing.xxl,
  },
});

export default HomeScreen;
