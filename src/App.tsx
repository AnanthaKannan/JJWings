import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  Calculate,
  LoginScreen,
  ProfileScreen,
  HomeworkScreen,
} from './screens';

// ✅ Nested stack inside the Homework tab — keeps bottom nav visible
const HomeworkStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    HomeworkScreen: {
      screen: HomeworkScreen,
    },
    Calculate: {
      screen: Calculate,
    },
  },
});

// ✅ Bottom tabs
const MainTabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: false,
    tabBarActiveTintColor: '#4F46E5',
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E5E7EB',
    },
  },
  screens: {
    // ✅ HomeworkStack replaces HomeworkScreen — Calculate lives inside it
    Homework: {
      screen: HomeworkStack,
      options: {
        tabBarLabel: 'Homework',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="book" color={color} size={size} />
        ),
      },
    },
    Logout: {
      screen: ProfileScreen,
      options: {
        tabBarLabel: 'Logout',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="logout" color={color} size={size} />
        ),
      },
    },
  },
});

// ✅ Root stack — only Login here, no Calculate
const RootStack = createNativeStackNavigator({
  initialRouteName: 'Login',
  screenOptions: { headerShown: false },
  screens: {
    Login: { screen: LoginScreen },
    Main: { screen: MainTabs },
  },
});

const Navigation = createStaticNavigation(RootStack);

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Navigation />
    </SafeAreaProvider>
  );
}

export default App;
