import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Ad } from '../../types';
import { colors, typography, spacing } from '../../theme';
import { formatPrice, formatTimestamp } from '../../utils/formatters';

// ─── Icons ────────────────────────────────────────────────────────────────────

const HeartIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.04L12 21.35Z"
      fill={filled ? colors.error : 'none'}
      stroke={filled ? colors.error : colors.textMuted}
      strokeWidth={1.8}
    />
  </Svg>
);

const PhoneIcon: React.FC = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 10.3a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1.7l3-.02a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
      stroke={colors.surface}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChatIcon: React.FC = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke={colors.primary}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface EliteAdCardProps {
  ad: Ad;
  onPress?: () => void;
  onFavoritePress?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EliteAdCard: React.FC<EliteAdCardProps> = ({ ad, onPress, onFavoritePress }) => {
  const [isFav, setIsFav] = useState(ad.isFavorite ?? false);
  const { t } = useTranslation();

  const imageUri = ad.images?.[0]?.url || ad.images?.[0]?.thumbnail || null;
  const price = formatPrice(ad.price, ad.currency, t);
  const time = formatTimestamp(ad.timestamp, t);
  const specEntries = Object.entries(ad.specs ?? {}).slice(0, 4);

  const handleFav = () => {
    setIsFav(prev => !prev);
    onFavoritePress?.(ad.id);
  };

  const handleCall = () => {
    if (ad.contactPhone) {
      Linking.openURL(`tel:${ad.contactPhone}`);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={imageUri ? { uri: imageUri } : undefined}
          style={[styles.image, !imageUri && styles.imagePlaceholder]}
          resizeMode="cover"
        />
        <View style={styles.eliteBadge}>
          <Text style={styles.eliteBadgeText}>{t('common.elite')}</Text>
        </View>
        <TouchableOpacity style={styles.favButton} onPress={handleFav} hitSlop={8}>
          <HeartIcon filled={isFav} size={18} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoBlock}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.title} numberOfLines={2}>{ad.title}</Text>

        {specEntries.length > 0 && (
          <View style={styles.specRow}>
            {specEntries.map(([key, val]) => (
              <View key={key} style={styles.specPill}>
                <Text style={styles.specText}>{String(val)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.meta}>{ad.location.name} · {time}</Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.8}>
            <ChatIcon />
            <Text style={styles.chatButtonText}>{t('search.chat')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
            <PhoneIcon />
            <Text style={styles.callButtonText}>{t('search.call')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrapper: {
    width: '100%',
    height: 220,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.skeletonBase,
  },
  eliteBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.elite,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eliteBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.eliteText,
  },
  favButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 5,
  },
  infoBlock: {
    padding: spacing.base,
  },
  price: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeights.normal,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  specPill: {
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  specText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  chatButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.primary,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  callButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.surface,
  },
});

export default EliteAdCard;
