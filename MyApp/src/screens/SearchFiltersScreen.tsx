import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

// Full implementation in Phase 5
const SearchFiltersScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search Filters – Phase 5</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
  },
  text: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
  },
});

export default SearchFiltersScreen;
