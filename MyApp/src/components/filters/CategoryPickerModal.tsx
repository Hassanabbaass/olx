import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Category } from '../../types';
import { colors, typography, spacing } from '../../theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BackIcon: React.FC = () => (
  <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

const ChevronRight: React.FC = () => (
  <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

const CheckIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  categories: Category[];
  selectedID?: string;
  onSelect: (category: Category | null) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CategoryPickerModal: React.FC<Props> = ({
  visible,
  categories,
  selectedID,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');

  const handleClose = () => {
    setParentCategory(null);
    setQuery('');
    onClose();
  };

  const handleBack = () => {
    setParentCategory(null);
    setQuery('');
  };

  const handlePress = (cat: Category) => {
    const hasChildren = cat.children && cat.children.length > 0;
    if (!parentCategory && hasChildren) {
      setParentCategory(cat);
      setQuery('');
    } else {
      setParentCategory(null);
      setQuery('');
      onSelect(cat);
    }
  };

  const baseList = parentCategory ? (parentCategory.children ?? []) : categories;
  const displayList = query.trim()
    ? baseList.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : baseList;

  const title = parentCategory ? parentCategory.name : t('filters.category');

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
          <TouchableOpacity
            onPress={parentCategory ? handleBack : handleClose}
            hitSlop={8}
            style={styles.headerBtn}
          >
            {parentCategory ? <BackIcon /> : <CloseIcon />}
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
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

        {/* "All categories" option (only on root level) */}
        {!parentCategory && !query && (
          <TouchableOpacity
            style={[styles.row, !selectedID && styles.rowSelected]}
            onPress={() => {
              setParentCategory(null);
              setQuery('');
              onSelect(null);
            }}
          >
            <Text style={[styles.rowText, !selectedID && styles.rowTextSelected]}>
              {t('common.any')}
            </Text>
            {!selectedID && <CheckIcon />}
          </TouchableOpacity>
        )}

        <FlatList
          data={displayList}
          keyExtractor={item => item.externalID}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const hasChildren = item.children && item.children.length > 0;
            const isSelected = item.externalID === selectedID;
            return (
              <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => handlePress(item)}
              >
                <Text style={[styles.rowText, isSelected && styles.rowTextSelected]} numberOfLines={1}>
                  {item.name}
                </Text>
                {hasChildren && !isSelected && <ChevronRight />}
                {isSelected && <CheckIcon />}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        />
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
});

export default CategoryPickerModal;
