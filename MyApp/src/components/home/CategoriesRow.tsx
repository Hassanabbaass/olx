import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Category } from '../../types';
import { colors, typography, spacing } from '../../theme';

// ─── Category Item ────────────────────────────────────────────────────────────

const CategoryItem: React.FC<{
  category: Category;
  onPress: (category: Category) => void;
}> = ({ category, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(category)}
      activeOpacity={0.75}
    >
      <View style={styles.iconWrapper}>
        {category.iconUrl ? (
          <Image
            source={{ uri: category.iconUrl }}
            style={styles.icon}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.iconFallback}>
            <Text style={styles.iconFallbackText}>
              {category.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoriesRowProps {
  categories: Category[];
  isLoading?: boolean;
  onCategoryPress: (category: Category) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CategoriesRow: React.FC<CategoriesRowProps> = ({
  categories,
  isLoading = false,
  onCategoryPress,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => (
        <CategoryItem category={item} onPress={onCategoryPress} />
      )}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  item: {
    alignItems: 'center',
    width: 64,
    marginRight: spacing.md,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  icon: {
    width: 36,
    height: 36,
  },
  iconFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallbackText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.tight,
  },
  loadingWrapper: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoriesRow;
