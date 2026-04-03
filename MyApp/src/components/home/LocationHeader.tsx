import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';

const ChevronDownIcon: React.FC = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={colors.primary}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface LocationHeaderProps {
  location?: string;
  onPress?: () => void;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  location = 'Lebanon',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={styles.label}>{location}</Text>
      {onPress && (
        <View style={styles.chevron}>
          <ChevronDownIcon />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.primary,
    marginRight: 4,
  },
  chevron: {
    marginTop: 1,
  },
});

export default LocationHeader;
