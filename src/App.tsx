import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import GlobalModal from './component/GlobalModal';
import Navigation from './navigation/RootNavigation';
import PushNotificationListener from './notifications/PushNotificationListener';
import PushNotificationRegistrar from './notifications/PushNotificationRegistrar';
import { store } from './store/store';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <PushNotificationRegistrar />
        <PushNotificationListener />
        <Navigation />
        <GlobalModal />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
