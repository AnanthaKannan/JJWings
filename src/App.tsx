import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
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
import {
  jjWingsApi,
  useLazyGetUnreadMessageCountQuery,
  useUpdateStudentFcmTokenMutation,
} from './store/api';
import {
  setMessageUnreadCount,
  showNotificationAttention,
  resetModal,
} from './store/slices';
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
  UpdatePasswordScreen,
  GameScreen,
  HomeworkScreen,
  PracticeScreen,
  QuizReviewScreen,
  // ── Admin screens (create these in your screens folder) ──
  StudentDirectoryScreen,
  TeacherDirectoryScreen,
  SameDeviceStudentsScreen,
  AddStudentScreen,
  HomeworkLibraryScreen,
  CreateNewTaskScreen,
  AssignHomeworkScreen,
  AssignByLevelScreen,
  ProgressDashboard,
  NotificationsScreen,
  AdminMessageScreen,
  AdminNotificationSendScreen,
  TopExplorerScreen,
  AdminProfileScreen,
  QuestionPaperScreen,
  AchievementsScreen,
  BillingRevenueScreen,
  CreateAcademyScreen,
} from './screens';
import ReuseModal from './component/ReuseModal';

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
      {shouldRing && <View style={styles.notificationAttentionDot} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────

function MessageTabIcon({ color, size }: { color: string; size: number }) {
  const unreadCount = useSelector(
    (state: RootState) => state.common.messageUnreadCount,
  );
  const displayCount = unreadCount > 99 ? '99+' : `${unreadCount}`;

  return (
    <View>
      <MaterialIcons name="mail" color={color} size={size} />
      {unreadCount > 0 ? (
        <View style={styles.messageUnreadBadge}>
          <Text style={styles.messageUnreadBadgeText}>{displayCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const HomeworkStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    HomeworkScreen: { screen: HomeworkScreen },
    Calculate: { screen: Calculate },
    QuizReview: { screen: QuizReviewScreen },
  },
});

const PracticeStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    PracticeScreen: { screen: PracticeScreen },
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
              params: {
                screen: 'HomeworkScreen',
                params: { type: 'homework' },
              },
            }),
          );
        },
      }),
    },
    Examination: {
      screen: HomeworkStack,
      options: ({ route }) => {
        const routeName =
          getFocusedRouteNameFromRoute(route) ?? 'HomeworkScreen';
        const shouldHideTabBar =
          routeName === 'Calculate' || routeName === 'QuizReview';

        return {
          tabBarLabel: 'Examination',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          unmountOnBlur: true,
          tabBarStyle: shouldHideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E5E7EB',
              },
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="assignment"
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
              name: 'Examination',
              params: {
                screen: 'HomeworkScreen',
                params: { type: 'exam' },
              },
            }),
          );
        },
      }),
    },
    Practice: {
      screen: PracticeStack,
      options: ({ route }) => {
        const routeName =
          getFocusedRouteNameFromRoute(route) ?? 'PracticeScreen';
        const shouldHideTabBar =
          routeName === 'Calculate' || routeName === 'QuizReview';

        return {
          tabBarLabel: 'Practice',
          unmountOnBlur: true,
          tabBarStyle: shouldHideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E5E7EB',
              },
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="psychology"
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
              name: 'Practice',
              params: {
                screen: 'PracticeScreen',
              },
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
    StudentMessages: {
      screen: AdminMessageScreen,
      options: {
        tabBarStyle: { display: 'none' },
        tabBarLabel: 'Messages',
        tabBarIcon: ({ color, size }) => (
          <MessageTabIcon color={color} size={size} />
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
    QuestionPapers: {
      screen: QuestionPaperScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Question Papers',
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="description"
            color={color}
            size={size}
            focused={focused}
          />
        ),
      },
    },
    Achievements: {
      screen: AchievementsScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Achievements',
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
    UpdatePassword: {
      screen: UpdatePasswordScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Update Password',
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
    Game: {
      screen: GameScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarStyle: { display: 'none' },
        tabBarLabel: 'Game',
        tabBarIcon: ({ color, size, focused }) => (
          <AnimatedTabIcon
            name="sports-esports"
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
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
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
    StudentProgress: { screen: ProgressDashboard },
    HomeworkScreen: { screen: HomeworkScreen },
    PracticeScreen: { screen: PracticeScreen },
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
    AssignByLevel: {
      screen: AssignByLevelScreen,
      options: {
        tabBarLabel: 'Assign',
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons
            name="assignment-turned-in"
            color={color}
            size={size}
          />
        ),
      },
    },
    AdminMessages: {
      screen: AdminMessageScreen,
      options: {
        tabBarLabel: 'Message',
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => (
          <MessageTabIcon color={color} size={size} />
        ),
      },
    },
    AdminNotificationSend: {
      screen: AdminNotificationSendScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Notification Send',
        unmountOnBlur: true,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="campaign" color={color} size={size} />
        ),
      },
    },
    AdminTeachers: {
      screen: TeacherDirectoryScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Teachers',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="school" color={color} size={size} />
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
    AdminProfile: {
      screen: AdminProfileScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="person" color={color} size={size} />
        ),
      },
    },
    AdminQuestionPapers: {
      screen: QuestionPaperScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Question Papers',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="description" color={color} size={size} />
        ),
      },
    },
    AdminAchievements: {
      screen: AchievementsScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Achievements',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="emoji-events" color={color} size={size} />
        ),
      },
    },
    UpdatePassword: {
      screen: UpdatePasswordScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Update Password',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="emoji-events" color={color} size={size} />
        ),
      },
    },
    BillingRevenue: {
      screen: BillingRevenueScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
        tabBarLabel: 'Achievements',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="emoji-events" color={color} size={size} />
        ),
      },
    },
    // Tab — Settings / Logout
    Logout: {
      screen: ProfileScreen,
      options: {
        tabBarButton: () => null,
        tabBarItemStyle: { display: 'none' },
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
    CreateAcademy: { screen: CreateAcademyScreen },
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

function ModelUse() {
  const modal = useSelector((state: RootState) => state.common.modal);
  const dispatch = useDispatch();
  return (
    <ReuseModal
      {...modal}
      onCancel={modal.onCancel || (() => dispatch(resetModal()))}
    />
  );
}

function PushNotificationListener() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.common.isAuthenticated,
  );
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [getUnreadMessageCount] = useLazyGetUnreadMessageCountQuery();
  const syncUnreadMessageCount = useCallback(() => {
    if (!isAuthenticated) return;

    getUnreadMessageCount()
      .unwrap()
      .then(unreadCount => {
        dispatch(setMessageUnreadCount(unreadCount));
        dispatch(
          jjWingsApi.util.invalidateTags([
            { type: 'Messages', id: 'LIST' },
            { type: 'Messages', id: 'STUDENTS' },
          ]),
        );
      })
      .catch(error => {
        console.error('Failed to load unread message count', error);
      });
  }, [dispatch, getUnreadMessageCount, isAuthenticated]);

  useEffect(() => {
    const unsubscribeMessage = onPushMessage(message => {
      if (message.title === 'New message') {
        syncUnreadMessageCount();
        return;
      } else if (message.title) {
        dispatch(showNotificationAttention());
      }
    });

    return unsubscribeMessage;
  }, [dispatch, syncUnreadMessageCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasInactive = appState.current.match(/inactive|background/);
      appState.current = nextAppState;

      if (wasInactive && nextAppState === 'active') {
        syncUnreadMessageCount();
      }
    });

    return () => subscription.remove();
  }, [syncUnreadMessageCount]);

  useEffect(() => {
    syncUnreadMessageCount();
  }, [syncUnreadMessageCount]);

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
        <ModelUse />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  notificationAttentionDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  messageUnreadBadge: {
    position: 'absolute',
    top: -7,
    right: -11,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  messageUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default App;
