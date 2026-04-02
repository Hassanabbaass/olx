import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomTabParamList } from '../types';
import { colors, typography, spacing } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

// ─── SVG Tab Icons ─────────────────────────────────────────────────────────────
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size: number;
}

const HomeIcon: React.FC<TabIconProps> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

const ChatsIcon: React.FC<TabIconProps> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

const SellIcon: React.FC<TabIconProps> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Line x1="12" y1="7" x2="12" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const MyAdsIcon: React.FC<TabIconProps> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} />
    <Line x1="7" y1="8" x2="17" y2="8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="7" y1="16" x2="13" y2="16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const AccountIcon: React.FC<TabIconProps> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
    <Path
      d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Sell Tab Button (center, elevated) ──────────────────────────────────────

const SellTabButton: React.FC<{ onPress?: () => void; label: string }> = ({ onPress, label }) => (
  <View style={styles.sellButtonWrapper}>
    <View style={styles.sellButton}>
      <SellIcon color={colors.textInverse} size={22} />
    </View>
    <Text style={styles.sellLabel}>{label}</Text>
  </View>
);

// ─── Navigator ────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: t('tabs.chats'),
          tabBarIcon: ({ color, size }) => <ChatsIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Sell"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <SellTabButton label={t('tabs.sell')} />
          ),
        }}
      />
      <Tab.Screen
        name="MyAds"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: t('tabs.myAds'),
          tabBarIcon: ({ color, size }) => <MyAdsIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: t('tabs.account'),
          tabBarIcon: ({ color, size }) => <AccountIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  tabLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  sellButtonWrapper: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sellLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
});

export default BottomTabNavigator;
