import { TextStyle } from 'react-native';

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export const lineHeights = {
  tight: 16,
  snug: 18,
  normal: 20,
  relaxed: 22,
  loose: 24,
  xl: 28,
};

const typography = {
  fontSizes,
  fontWeights,
  lineHeights,
};

export default typography;
