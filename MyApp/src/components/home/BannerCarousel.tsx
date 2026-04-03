import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 140;

interface BannerConfig {
  id: string;
  backgroundColor: string;
  titleKey: string;
  ctaKey: string;
  accentColor: string;
}

// Static banners — no banner API available
const BANNER_CONFIGS: BannerConfig[] = [
  { id: '1', backgroundColor: '#002F34', titleKey: 'home.banner1Title', ctaKey: 'home.banner1Cta', accentColor: '#23E5DB' },
  { id: '2', backgroundColor: '#1A237E', titleKey: 'home.banner2Title', ctaKey: 'home.banner2Cta', accentColor: '#FFD600' },
  { id: '3', backgroundColor: '#B71C1C', titleKey: 'home.banner3Title', ctaKey: 'home.banner3Cta', accentColor: '#FFFFFF' },
];

const BannerItem: React.FC<{ config: BannerConfig }> = ({ config }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: config.backgroundColor }]}
      activeOpacity={0.9}
    >
      <View style={styles.bannerContent}>
        <Text style={[styles.bannerTitle, { color: config.accentColor }]}>
          {t(config.titleKey)}
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: config.accentColor }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: config.backgroundColor }]}>
            {t(config.ctaKey)}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const BannerCarousel: React.FC = () => {
  const flatListRef = useRef<FlatList<BannerConfig>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const scrollToNext = useCallback(() => {
    const next = (activeIndexRef.current + 1) % BANNER_CONFIGS.length;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    activeIndexRef.current = next;
    setActiveIndex(next);
  }, []);

  useEffect(() => {
    const timer = setInterval(scrollToNext, 3500);
    return () => clearInterval(timer);
  }, [scrollToNext]);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={BANNER_CONFIGS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <BannerItem config={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          activeIndexRef.current = index;
          setActiveIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {BANNER_CONFIGS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.lineHeights.xl,
    marginBottom: spacing.sm,
  },
  ctaButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  ctaText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
    borderRadius: 3,
  },
});

export default BannerCarousel;
