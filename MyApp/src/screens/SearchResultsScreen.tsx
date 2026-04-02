import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

// Full implementation in Phase 4
const SearchResultsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search Results – Phase 4</Text>
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

export default SearchResultsScreen;
