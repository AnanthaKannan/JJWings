import { StatusBar, Alert, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';

import {
  Calculate,
  LoginScreen,
  ProfileScreen,
  HomeworkScreen,
  QuizReviewScreen,
  // ── Admin screens (create these in your screens folder) ──
  StudentDirectoryScreen,
  AddStudentScreen,
  HomeworkLibraryScreen,
  CreateNewTaskScreen,
  AssignHomeworkScreen,
} from './screens';

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────

const HomeworkStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    HomeworkScreen: { screen: HomeworkScreen },
    Calculate: { screen: Calculate },
    QuizReview: { screen: QuizReviewScreen },
  },
});

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
      listeners: ({ navigation }) => ({
        tabPress: e => {
          e.preventDefault();
          Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes',
                style: 'destructive',
                onPress: () =>
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
              },
            ],
            { cancelable: true },
          );
        },
      }),
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────

// Nested stack inside Students tab so detail screens don't hide the tab bar
const AdminStudentsStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    StudentDirectory: { screen: StudentDirectoryScreen },
    AddStudent: { screen: AddStudentScreen },
    HomeworkLibrary: { screen: HomeworkLibraryScreen },
    CreateNewTask: { screen: CreateNewTaskScreen },
    AssignHomework: { screen: AssignHomeworkScreen },
  },
});

const AdminTabs = createBottomTabNavigator({
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
    // Tab 1 — Students (with nested stack)
    AdminStudents: {
      screen: AdminStudentsStack,
      options: {
        tabBarLabel: 'Students',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="people" color={color} size={size} />
        ),
      },
    },

    AdminAddStudent: {
      screen: AddStudentScreen,
      options: {
        tabBarLabel: 'Add Student',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="menu-book" color={color} size={size} />
        ),
      },
    },
    HomeworkLibrary: {
      screen: HomeworkLibraryScreen,
      options: {
        tabBarLabel: 'Homework',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="bar-chart" color={color} size={size} />
        ),
      },
    },
    CreateNewTask: {
      screen: CreateNewTaskScreen,
      options: {
        tabBarLabel: 'new Task',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="bar-chart" color={color} size={size} />
        ),
      },
    },
    AssignHomework: {
      screen: AssignHomeworkScreen,
      options: {
        tabBarLabel: 'assign task',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="bar-chart" color={color} size={size} />
        ),
      },
    },

    // Tab 2 — Library
    // Library: {
    //   screen: AdminLibraryScreen,
    //   options: {
    //     tabBarLabel: 'Library',
    //     tabBarIcon: ({ color, size }) => (
    //       <MaterialIcons name="menu-book" color={color} size={size} />
    //     ),
    //   },
    // },

    // // Tab 3 — Reports
    // Reports: {
    //   screen: AdminReportsScreen,
    //   options: {
    //     tabBarLabel: 'Reports',
    //     tabBarIcon: ({ color, size }) => (
    //       <MaterialIcons name="bar-chart" color={color} size={size} />
    //     ),
    //   },
    // },

    // // Tab 4 — Settings / Logout
    Logout: {
      screen: ProfileScreen,
      options: {
        tabBarLabel: 'Logout',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="logout" color={color} size={size} />
        ),
      },
      listeners: ({ navigation }) => ({
        tabPress: e => {
          e.preventDefault();
          Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes',
                style: 'destructive',
                onPress: () =>
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
              },
            ],
            { cancelable: true },
          );
        },
      }),
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STACK
// Login → decides role → pushes either Main (student) or Admin
// ─────────────────────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator({
  initialRouteName: 'Login',
  screenOptions: { headerShown: false },
  screens: {
    Login: { screen: LoginScreen },
    Main: { screen: MainTabs }, // student flow
    Admin: { screen: AdminTabs }, // admin flow
  },
});

const Navigation = createStaticNavigation(RootStack);

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Navigation />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
