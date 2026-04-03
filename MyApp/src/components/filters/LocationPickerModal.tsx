import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Location } from '../../types';
import { colors, typography, spacing } from '../../theme';
import useLocations from '../../hooks/useLocations';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  selectedID?: string;
  onSelect: (location: Location | null) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LocationPickerModal: React.FC<Props> = ({
  visible,
  selectedID,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { locations, isLoading, fetchLebanon } = useLocations();

  useEffect(() => {
    if (visible && locations.length === 0) {
      fetchLebanon();
    }
  }, [visible, locations.length, fetchLebanon]);

  const filtered = query.trim()
    ? locations.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
    : locations;

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (loc: Location | null) => {
    setQuery('');
    onSelect(loc);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={8} style={styles.headerBtn}>
            <CloseIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('filters.location')}</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.searchPlaceholder')}
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {isLoading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.primary}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.externalID}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={() => (
              // "All Lebanon" option
              !query ? (
                <TouchableOpacity
                  style={[styles.row, !selectedID && styles.rowSelected]}
                  onPress={() => handleSelect(null)}
                >
                  <Text style={[styles.rowText, !selectedID && styles.rowTextSelected]}>
                    {t('filters.lebanon')}
                  </Text>
                  {!selectedID && <CheckIcon />}
                </TouchableOpacity>
              ) : null
            )}
            renderItem={({ item }) => {
              const isSelected = item.externalID === selectedID;
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.rowText, isSelected && styles.rowTextSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isSelected && <CheckIcon />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>{t('common.noResults')}</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 36,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  searchBox: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    height: 40,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  rowSelected: {
    backgroundColor: colors.background,
  },
  rowText: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  rowTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeights.semiBold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.base,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.textSecondary,
  },
});

export default LocationPickerModal;
