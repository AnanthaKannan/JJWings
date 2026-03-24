import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Calculate, LoginScreen } from './src/screens';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

const RootStack = createNativeStackNavigator({
  initialRouteName: 'Login',
  screens: {
    Calculate: Calculate,
    Login: {
      screen: LoginScreen,
      options: {
        headerShown: false,
      },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

function AppContent() {
  return (
    <Navigation />
    // <View style={styles.container}>
    //   {/* <LoginScreen
    //     onLogin={(name, code) => console.log(name, code)}
    //     onForgotCode={() => console.log('forgot code')}
    //     onJoinNow={() => console.log('join now')}
    //   /> */}
    //   <Calculate />
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    backgroundColor: '#EEF2FF',
  },
});

export default App;
