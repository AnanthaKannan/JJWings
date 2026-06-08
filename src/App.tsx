import { useEffect, useRef } from 'react';
import { Animated, StatusBar, View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  CommonActions,
  createStaticNavigation,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from '../src/store/store';
import { useUpdateStudentFcmTokenMutation } from './store/api';
import { showNotificationAttention } from './store/slices';
import {
  getStudentPushToken as getPushToken,
  onStudentPushMessage as onPushMessage,
  onStudentPushTokenRefresh as onPushTokenRefresh,
} from './services/pushNotifications';

import {
  Calculate,
  LoginScreen,
  ProfileScreen,
  StudentProfileScreen,
  HomeworkScreen,
  QuizReviewScreen,
  // ── Admin screens (create these in your screens folder) ──
  StudentDirectoryScreen,
  SameDeviceStudentsScreen,
  AddStudentScreen,
  HomeworkLibraryScreen,
  CreateNewTaskScreen,
  AssignHomeworkScreen,
  ProgressDashboard,
  NotificationsScreen,
  AdminMessageScreen,
  TopExplorerScreen,
} from './screens';

type AnimatedTabIconProps = {
  name: string;
  color: string;
  size: number;
  focused: boolean;
};

type NotificationTabIconProps = {
  color: string;
  size: number;
  focused?: boolean;
};

function AnimatedTabIcon({ name, color, size, focused }: AnimatedTabIconProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      friction: 4,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-7deg'],
  });

  return (
    <Animated.View
      style={{ transform: [{ translateY }, { scale }, { rotate }] }}
    >
      <MaterialIcons name={name} color={color} size={size} />
    </Animated.View>
  );
}

function NotificationTabIcon({
  color,
  size,
  focused = false,
}: NotificationTabIconProps) {
  const hasNotificationAttention = useSelector(
    (state: RootState) => state.common.hasNotificationAttention,
  );
  const ring = useRef(new Animated.Value(0)).current;
  const shouldRing = hasNotificationAttention && !focused;

  useEffect(() => {
    if (!shouldRing) {
      ring.stopAnimation();
      ring.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: -1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0.7,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [ring, shouldRing]);

  const rotate = ring.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-16deg', '16deg'],
  });

  return (
    <View>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <MaterialIcons name="notifications" color={color} size={size} />
      </Animated.View>
      {shouldRing && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -3,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: '#EF4444',
            borderWidth: 1,
            borderColor: '#FFFFFF',
          }}
        />
      )}
    </View>
  );
}

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
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="insights"
            color={color}
            size={size}
            focused={focused}
          />
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
          tabBarStyle: shouldHideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E5E7EB',
              },
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="book"
              color={color}
              size={size}
              focused={focused}
            />
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
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="emoji-events"
            color={color}
            size={size}
            focused={focused}
          />
        ),
      },
    },
    Notifications: {
      screen: NotificationsScreen,
      options: {
        tabBarLabel: 'Notifications',
        tabBarIcon: ({ color, size, focused }) => (
          <NotificationTabIcon color={color} size={size} focused={focused} />
        ),
      },
    },
    SameDeviceStudents: {
      screen: SameDeviceStudentsScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Same Device',
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="devices-other"
            color={color}
            size={size}
            focused={focused}
          />
        ),
      },
    },
    StudentProfile: {
      screen: StudentProfileScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="person"
            color={color}
            size={size}
            focused={focused}
          />
        ),
      },
    },
    Logout: {
      screen: ProfileScreen,
      options: {
        tabBarLabel: 'Logout',
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="logout"
            color={color}
            size={size}
            focused={focused}
          />
        ),
      },
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
    StudentNotifications: { screen: NotificationsScreen },
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
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
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
    AdminNotifications: {
      screen: NotificationsScreen,
      options: {
        tabBarLabel: 'Notifications',
        tabBarIcon: ({ color, size, focused }) => (
          <NotificationTabIcon color={color} size={size} focused={focused} />
        ),
      },
    },
    AdminRanking: {
      screen: TopExplorerScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Rank',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="leaderboard" color={color} size={size} />
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

function PushNotificationRegistrar() {
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const isStudent = useSelector((state: RootState) => state.common.isStudent);
  const adminId = useSelector((state: RootState) => state.common.adminId);
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);

  const [updateStudentFcmToken] = useUpdateStudentFcmTokenMutation();

  useEffect(() => {
    const canRegisterToken = (isStudent && studentId) || (isAdmin && adminId);
    if (!canRegisterToken) return;

    let isActive = true;

    const registerToken = async () => {
      try {
        const token = await getPushToken();

        if (!token || !isActive) return;

        await updateStudentFcmToken({ fcmToken: token }).unwrap();
      } catch (error) {
        console.error('Failed to register push token', error);
      }
    };

    registerToken();

    const unsubscribe = onPushTokenRefresh(token => {
      updateStudentFcmToken({ fcmToken: token }).catch(error => {
        console.error('Failed to refresh push token', error);
      });
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [adminId, isAdmin, isStudent, studentId, updateStudentFcmToken]);

  return null;
}

function PushNotificationListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribeMessage = onPushMessage(() => {
      dispatch(showNotificationAttention());
    });

    return unsubscribeMessage;
  }, [dispatch]);

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
