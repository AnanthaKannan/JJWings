import React from 'react';
import {
  CommonActions,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  AchievementsScreen,
  AddStudentScreen,
  AdminMessageScreen,
  AdminNotificationSendScreen,
  AdminProfileScreen,
  AssignByLevelScreen,
  AssignHomeworkScreen,
  BillingRevenueScreen,
  CreateMessageGroupScreen,
  CreateNewTaskScreen,
  HomeworkLibraryScreen,
  HomeworkScreen,
  NotificationsScreen,
  PracticeScreen,
  ProfileScreen,
  ProgressDashboard,
  QuestionPaperScreen,
  QuizReviewScreen,
  StudentDirectoryScreen,
  TeacherDirectoryScreen,
  TopExplorerScreen,
  UpdatePasswordScreen,
  MessageChatPaneScreen,
} from '../screens';
import { MessageTabIcon, NotificationTabIcon } from './TabIcons';

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

const AdminMessagesStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    AdminMessagesList: { screen: AdminMessageScreen },
    CreateMessageGroup: { screen: CreateMessageGroupScreen },
    MessageChatPane: { screen: MessageChatPaneScreen },
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
        unmountOnBlur: true,
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
      screen: AdminMessagesStack,
      options: ({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route);
        const shouldHideTabBar = ['CreateMessageGroup', 'MessageChatPane'].some(
          route_ => route_ === routeName,
        );
        return {
          tabBarLabel: 'Message',
          tabBarStyle: shouldHideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E5E7EB',
              },
          tabBarIcon: ({ color, size }) => (
            <MessageTabIcon color={color} size={size} />
          ),
        };
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
        tabBarItemStyle: { display: 'none' },
        tabBarStyle: { display: 'none' },
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
        tabBarItemStyle: { display: 'none' },
        tabBarStyle: { display: 'none' },
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
        tabBarItemStyle: { display: 'none' },
        tabBarStyle: { display: 'none' },
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

export default AdminTabs;
