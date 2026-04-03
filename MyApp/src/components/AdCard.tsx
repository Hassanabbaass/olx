import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Ad } from '../types';
import { colors, typography, spacing } from '../theme';
import { formatPrice, formatTimestamp, truncate } from '../utils/formatters';

// ─── Heart (Favourite) Icon ───────────────────────────────────────────────────

const HeartIcon: React.FC<{ filled: boolean; size?: number }> = ({
  filled,
  size = 18,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.04L12 21.35Z"
      fill={filled ? colors.error : 'none'}
      stroke={filled ? colors.error : colors.textMuted}
      strokeWidth={1.8}
    />
  </Svg>
);

// ─── Elite Badge ──────────────────────────────────────────────────────────────

const EliteBadge: React.FC = () => (
  <View style={styles.eliteBadge}>
    <Text style={styles.eliteBadgeText}>Elite</Text>
  </View>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdCardProps {
  ad: Ad;
  /** 'horizontal' = compact card for home sections (~160px wide)
   *  'vertical'   = full-width card for search results list */
  variant?: 'horizontal' | 'vertical';
  onPress?: () => void;
  onFavoritePress?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdCard: React.FC<AdCardProps> = ({
  ad,
  variant = 'horizontal',
  onPress,
  onFavoritePress,
}) => {
  const { t } = useTranslation();
  const [isFav, setIsFav] = useState(ad.isFavorite ?? false);

  const imageUri = ad.images?.[0]?.thumbnail || ad.images?.[0]?.url || null;
  const price = formatPrice(ad.price, ad.currency);
  const time = formatTimestamp(ad.timestamp, t);

  const handleFav = () => {
    setIsFav(prev => !prev);
    onFavoritePress?.(ad.id);
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Image */}
        <View style={styles.horizontalImageWrapper}>
          <Image
            source={imageUri ? { uri: imageUri } : undefined}
            style={[styles.horizontalImage, !imageUri && styles.imagePlaceholder]}
            resizeMode="cover"
          />
          {ad.isElite && <EliteBadge />}
          <TouchableOpacity style={styles.favButton} onPress={handleFav} hitSlop={8}>
            <HeartIcon filled={isFav} size={16} />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.horizontalInfo}>
          <Text style={styles.price} numberOfLines={1}>
            {price}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {ad.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {truncate(ad.location.name ?? '', 20)} · {time}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Vertical variant (used in Search Results)
  return (
    <TouchableOpacity
      style={styles.verticalCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.verticalImageWrapper}>
        <Image
            source={imageUri ? { uri: imageUri } : undefined}
            style={[styles.verticalImage, !imageUri && styles.imagePlaceholder]}
            resizeMode="cover"
          />
        {ad.isElite && <EliteBadge />}
        <TouchableOpacity style={styles.favButton} onPress={handleFav} hitSlop={8}>
          <HeartIcon filled={isFav} size={18} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.verticalInfo}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>
        <Text style={styles.meta}>
          {typeof ad.location.name === 'string' ? ad.location.name : ''} · {time}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Horizontal card
  horizontalCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginRight: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  horizontalImageWrapper: {
    width: '100%',
    height: 110,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalInfo: {
    padding: spacing.sm,
  },

  // Vertical card
  verticalCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  verticalImageWrapper: {
    width: '100%',
    height: 200,
  },
  verticalImage: {
    width: '100%',
    height: '100%',
  },
  verticalInfo: {
    padding: spacing.sm,
  },

  // Shared
  imagePlaceholder: {
    backgroundColor: colors.skeletonBase,
  },
  price: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.regular,
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: typography.lineHeights.snug,
  },
  meta: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  favButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 4,
  },
  eliteBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.elite,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  eliteBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.eliteText,
  },
});

export default AdCard;
