import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, DevSettings } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../store/AppContext';
import { Language } from '../i18n';
import { colors, typography, spacing } from '../theme';

/**
 * Tappable language toggle. Persists the chosen language via AsyncStorage,
 * applies I18nManager RTL flag, then reloads the app so layout direction
 * takes full effect.
 *
 * In dev builds: uses DevSettings.reload() for instant hot-reload.
 * In release builds: prompts the user to restart manually (no RN core API
 * for programmatic restart without an extra native library).
 */
const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppContext();

  const handlePress = async () => {
    const next: Language = language === 'en' ? 'ar' : 'en';
    await setLanguage(next);

    if (__DEV__) {
      DevSettings.reload();
    } else {
      Alert.alert(
        next === 'ar' ? 'إعادة التشغيل مطلوبة' : 'Restart Required',
        next === 'ar'
          ? 'أغلق التطبيق وأعد فتحه لتطبيق تغيير اللغة.'
          : 'Close and reopen the app to apply the language change.',
      );
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={8} style={styles.btn}>
      <Text style={styles.text}>{t('language.switchTo')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
});

export default LanguageSwitcher;
