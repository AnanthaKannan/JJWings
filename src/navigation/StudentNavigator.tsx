import React from 'react';
import {
  CommonActions,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AchievementsScreen,
  AdminMessageScreen,
  Calculate,
  GameScreen,
  HomeworkScreen,
  NotificationsScreen,
  PracticeScreen,
  ProfileScreen,
  ProgressDashboard,
  QuestionPaperScreen,
  QuizReviewScreen,
  SameDeviceStudentsScreen,
  StudentProfileScreen,
  TopExplorerScreen,
  UpdatePasswordScreen,
} from '../screens';
import {
  AnimatedTabIcon,
  MessageTabIcon,
  NotificationTabIcon,
} from './TabIcons';

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

export default MainTabs;
