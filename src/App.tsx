import { useEffect } from 'react';
import { StatusBar, Alert, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  CommonActions,
  createStaticNavigation,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from '../src/store/store';
import { clearSavedLoginCredentials } from './util/authStorage';
import { logout } from './store/slices';
import { useUpdateStudentFcmTokenMutation } from './store/api';
import {
  getStudentPushToken,
  onStudentPushMessage,
  onStudentPushTokenRefresh,
} from './services/pushNotifications';

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
  NotificationsScreen,
  AdminMessageScreen,
  TopExplorerScreen,
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
      options: ({ route }) => {
        const routeName =
          getFocusedRouteNameFromRoute(route) ?? 'HomeworkScreen';
        const shouldHideTabBar =
          routeName === 'Calculate' || routeName === 'QuizReview';

        return {
          tabBarLabel: 'Homework',
          unmountOnBlur: true,
          tabBarStyle:
            shouldHideTabBar
              ? { display: 'none' }
              : {
                  backgroundColor: '#FFFFFF',
                  borderTopColor: '#E5E7EB',
                },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="book" color={color} size={size} />
          ),
        };
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
    TopExplorer: {
      screen: TopExplorerScreen,
      options: {
        tabBarLabel: 'Top',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="emoji-events" color={color} size={size} />
        ),
      },
    },
    Notifications: {
      screen: NotificationsScreen,
      options: {
        tabBarLabel: 'Notifications',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="notifications" color={color} size={size} />
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
                onPress: async () => {
                  await logoutCurrentUser();
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                },
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
      options: ({ route }) => {
        const routeName =
          getFocusedRouteNameFromRoute(route) ?? 'StudentDirectory';
        const shouldHideTabBar = routeName === 'AssignHomework';

        return {
          tabBarLabel: 'Students',
          tabBarStyle: shouldHideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E5E7EB',
              },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" color={color} size={size} />
          ),
        };
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
    AdminMessages: {
      screen: AdminMessageScreen,
      options: {
        tabBarLabel: 'Message',
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="mail" color={color} size={size} />
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
                onPress: async () => {
                  await logoutCurrentUser();
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                },
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

const logoutCurrentUser = async () => {
  await clearSavedLoginCredentials();
  store.dispatch(logout());
};

function PushNotificationRegistrar() {
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const isStudent = useSelector((state: RootState) => state.common.isStudent);
  const [updateStudentFcmToken] = useUpdateStudentFcmTokenMutation();

  useEffect(() => {
    if (!studentId || !isStudent) return;

    let isActive = true;

    const registerToken = async () => {
      try {
        const token = await getStudentPushToken();

        if (!token || !isActive) return;

        await updateStudentFcmToken({ fcmToken: token }).unwrap();
      } catch (error) {
        console.error('Failed to register push token', error);
      }
    };

    registerToken();

    const unsubscribe = onStudentPushTokenRefresh(token => {
      updateStudentFcmToken({ fcmToken: token }).catch(error => {
        console.error('Failed to refresh push token', error);
      });
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [isStudent, studentId, updateStudentFcmToken]);

  return null;
}

function PushNotificationListener() {
  useEffect(() => {
    const unsubscribeMessage = onStudentPushMessage(message => {
      Alert.alert(
        message.title ?? 'New homework assigned',
        message.body ?? 'You have new homework to attend.',
      );
    });

    return unsubscribeMessage;
  }, []);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <PushNotificationRegistrar />
        <PushNotificationListener />
        <Navigation />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
