import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 140;

interface Banner {
  id: string;
  backgroundColor: string;
  title: string;
  subtitle: string;
  ctaText: string;
  accentColor: string;
}

// Static banners — no banner API available
const BANNERS: Banner[] = [
  {
    id: '1',
    backgroundColor: '#002F34',
    title: 'BUY YOUR\nMOBILE\nDIRECTLY',
    subtitle: '',
    ctaText: 'ORDER NOW',
    accentColor: '#23E5DB',
  },
  {
    id: '2',
    backgroundColor: '#1A237E',
    title: 'FIND YOUR\nDREAM\nHOME',
    subtitle: '',
    ctaText: 'EXPLORE',
    accentColor: '#FFD600',
  },
  {
    id: '3',
    backgroundColor: '#B71C1C',
    title: 'BEST DEALS\nON CARS',
    subtitle: '',
    ctaText: 'SHOP NOW',
    accentColor: '#FFFFFF',
  },
];

const BannerItem: React.FC<{ banner: Banner }> = ({ banner }) => (
  <TouchableOpacity
    style={[styles.banner, { backgroundColor: banner.backgroundColor }]}
    activeOpacity={0.9}
  >
    <View style={styles.bannerContent}>
      <Text style={[styles.bannerTitle, { color: banner.accentColor }]}>
        {banner.title}
      </Text>
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: banner.accentColor }]}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.ctaText,
            { color: banner.backgroundColor },
          ]}
        >
          {banner.ctaText}
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const BannerCarousel: React.FC = () => {
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const scrollToNext = useCallback(() => {
    const next = (activeIndexRef.current + 1) % BANNERS.length;
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
        data={BANNERS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <BannerItem banner={item} />}
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
        {BANNERS.map((_, i) => (
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
