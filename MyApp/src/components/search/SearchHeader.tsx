import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackArrow: React.FC = () => (
  <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={colors.textPrimary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const SearchIcon: React.FC = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={colors.placeholder} strokeWidth={1.8} />
    <Path
      d="M16.5 16.5L21 21"
      stroke={colors.placeholder}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface SearchHeaderProps {
  query: string;
  onQueryChange: (text: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SearchHeader: React.FC<SearchHeaderProps> = ({
  query,
  onQueryChange,
  onSubmit,
  onBack,
  placeholder = 'What are you looking for?',
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backButton}>
        <BackArrow />
      </TouchableOpacity>

      <View style={styles.inputWrapper}>
        <SearchIcon />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },
});

export default SearchHeader;
