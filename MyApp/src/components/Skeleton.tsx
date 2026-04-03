import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Single animated shimmer block. Reuse this wherever a loading placeholder
 * is needed. The pulse animation runs on the native driver so it's smooth
 * even during JS-heavy operations.
 */
const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = 4, style }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius, opacity }, style]}
    />
  );
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.skeletonBase,
  },
});

export default Skeleton;

// ─── Convenience layout helpers ───────────────────────────────────────────────

/** Vertical card skeleton — matches the vertical AdCard used in Search Results */
export const VerticalCardSkeleton: React.FC = () => (
  <View style={cardStyles.card}>
    <Skeleton width="100%" height={200} borderRadius={0} />
    <View style={cardStyles.info}>
      <Skeleton width={100} height={16} />
      <Skeleton width="80%" height={13} />
      <Skeleton width="55%" height={11} />
    </View>
  </View>
);

/** Horizontal card skeleton — matches the horizontal AdCard used in Home sections */
export const HorizontalCardSkeleton: React.FC = () => (
  <View style={cardStyles.hCard}>
    <Skeleton width={160} height={110} borderRadius={0} />
    <View style={cardStyles.hInfo}>
      <Skeleton width={90} height={14} />
      <Skeleton width={120} height={12} />
      <Skeleton width={80} height={11} />
    </View>
  </View>
);

/** Category icon skeleton — matches the CategoriesRow item */
export const CategorySkeleton: React.FC = () => (
  <View style={cardStyles.catItem}>
    <Skeleton width={52} height={52} borderRadius={26} />
    <Skeleton width={44} height={10} style={{ marginTop: 6 }} />
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    padding: 12,
    gap: 8,
  },
  hCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hInfo: {
    padding: 8,
    gap: 6,
  },
  catItem: {
    alignItems: 'center',
    width: 64,
    marginRight: 12,
  },
});
