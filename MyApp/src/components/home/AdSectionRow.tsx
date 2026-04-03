import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ad } from '../../types';
import { colors, typography, spacing } from '../../theme';
import AdCard from '../AdCard';
import { HorizontalCardSkeleton } from '../Skeleton';

interface AdSectionRowProps {
  title: string;
  ads: Ad[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  onAdPress?: (ad: Ad) => void;
}

const AdSectionRow: React.FC<AdSectionRowProps> = ({
  title,
  ads,
  isLoading = false,
  onSeeAll,
  onAdPress,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.skeletonRow}>
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
        </View>
      ) : ads.length === 0 ? null : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AdCard
              ad={item}
              variant="horizontal"
              onPress={() => onAdPress?.(item)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  list: {
    paddingHorizontal: spacing.base,
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },
});

export default AdSectionRow;
