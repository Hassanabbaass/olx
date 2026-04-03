import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

// ─── Single animated block ────────────────────────────────────────────────────

interface SkeletonBlockProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  opacity: Animated.AnimatedInterpolation<number>;
}

const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width,
  height,
  borderRadius = 4,
  opacity,
}) => (
  <Animated.View
    style={[styles.block, { width, height, borderRadius, opacity }]}
  />
);

// ─── Single skeleton card ─────────────────────────────────────────────────────

interface SkeletonCardProps {
  opacity: Animated.AnimatedInterpolation<number>;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ opacity }) => (
  <View style={styles.card}>
    <SkeletonBlock width="100%" height={200} borderRadius={0} opacity={opacity} />
    <View style={styles.info}>
      <SkeletonBlock width={130} height={18} opacity={opacity} />
      <SkeletonBlock width="75%" height={14} opacity={opacity} />
      <SkeletonBlock width="50%" height={12} opacity={opacity} />
    </View>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const LoadingSkeleton: React.FC = () => {
  const animation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animation]);

  return (
    <View style={styles.container}>
      <SkeletonCard opacity={animation} />
      <SkeletonCard opacity={animation} />
      <SkeletonCard opacity={animation} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  block: {
    backgroundColor: colors.skeletonBase,
  },
});

export default LoadingSkeleton;
