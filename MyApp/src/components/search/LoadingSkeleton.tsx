import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { VerticalCardSkeleton } from '../Skeleton';

/**
 * Full-screen loading placeholder for the Search Results list.
 * Shows 3 animated vertical card skeletons.
 */
const LoadingSkeleton: React.FC = () => (
  <View style={styles.container}>
    <VerticalCardSkeleton />
    <VerticalCardSkeleton />
    <VerticalCardSkeleton />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
});

export default LoadingSkeleton;
