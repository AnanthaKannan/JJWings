import { StatusBar, Alert, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  CommonActions,
  createStaticNavigation,
} from '@react-navigation/native';
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
  ProgressDashboard,
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
    Progress: {
      screen: ProgressDashboard,
      options: {
        tabBarLabel: 'Progress',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="insights" color={color} size={size} />
        ),
      },
    },
    Homework: {
      screen: HomeworkStack,
      options: {
        tabBarLabel: 'Homework',
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="book" color={color} size={size} />
        ),
      },
      listeners: ({ navigation }) => ({
        tabPress: e => {
          e.preventDefault();
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Homework',
              params: { screen: 'HomeworkScreen' },
            }),
          );
        },
      }),
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
    HomeworkScreen: { screen: HomeworkScreen },
    QuizReview: { screen: QuizReviewScreen },
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
      listeners: ({ navigation }) => ({
        tabPress: e => {
          e.preventDefault();
          navigation.dispatch(
            CommonActions.navigate({
              name: 'AdminStudents',
              params: { screen: 'StudentDirectory' },
            }),
          );
        },
      }),
    },

    AdminAddStudent: {
      screen: AddStudentScreen,
      options: {
        tabBarLabel: 'Add Student',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="person-add" color={color} size={size} />
        ),
        unmountOnBlur: true, // ✅ forces remount every time tab is visited
      },
    },
    HomeworkLibrary: {
      screen: HomeworkLibraryScreen,
      options: {
        tabBarLabel: 'Homework',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="library-books" color={color} size={size} />
        ),
      },
    },
    CreateNewTask: {
      screen: CreateNewTaskScreen,
      options: {
        tabBarLabel: 'new Task',
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="playlist-add" color={color} size={size} />
        ),
      },
    },
    // Tab — Settings / Logout
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
