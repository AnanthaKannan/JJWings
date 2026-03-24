import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  Calculate,
  LoginScreen,
  ProfileScreen,
  HomeworkScreen,
} from './screens';

// ✅ Bottom tabs for the main app (after login)
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
    Calculate: {
      screen: Calculate,
      options: {
        tabBarLabel: 'Calculate',
        tabBarIcon: ({ color, size }) => (
          // Using a simple text icon — swap with react-native-vector-icons if available
          <TabIcon label="⊞" color={color} size={size} />
        ),
      },
    },
    Homework: {
      screen: HomeworkScreen,
      options: {
        tabBarLabel: 'Homework',
        tabBarIcon: ({ color, size }) => (
          <TabIcon label="⊞" color={color} size={size} />
        ),
      },
    },
    Dashboard: {
      screen: ProfileScreen, // replace with your Profile screen
      options: {
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <TabIcon label="👤" color={color} size={size} />
        ),
      },
    },
    Final: {
      screen: ProfileScreen, // replace with your Profile screen
      options: {
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <TabIcon label="👤" color={color} size={size} />
        ),
      },
    },
  },
});

// ✅ Root stack — Login is at root level, not inside tabs
const RootStack = createNativeStackNavigator({
  initialRouteName: 'Login',
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Login: {
      screen: LoginScreen,
    },
    Main: {
      screen: MainTabs,
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

// Simple emoji/text icon helper (replace with vector icons for production)
function TabIcon({
  label,
  color,
  size,
}: {
  label: string;
  color: string;
  size: number;
}) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: size, color }}>{label}</Text>;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Navigation />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
});

export default App;
