import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';

import i18n, { getStoredLanguage, Language } from './src/i18n';
import { AppProvider } from './src/store/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const App: React.FC = () => {
  const [initialLanguage, setInitialLanguage] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const lang = await getStoredLanguage();
      const rtl = lang === 'ar';
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
      await i18n.changeLanguage(lang);
      setInitialLanguage(lang);
      setIsReady(true);
    };
    bootstrap();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.surface}
        translucent={false}
      />
      <AppProvider initialLanguage={initialLanguage}>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;
