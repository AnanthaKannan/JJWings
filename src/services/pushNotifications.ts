import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

const requestAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const getStudentPushToken = async () => {
  const hasAndroidPermission = await requestAndroidNotificationPermission();
  if (!hasAndroidPermission) return null;

  await messaging().registerDeviceForRemoteMessages();
  const authStatus = await messaging().requestPermission();
  const isAuthorized =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!isAuthorized && Platform.OS !== 'android') return null;

  return messaging().getToken();
};

export const getCurrentStudentPushToken = () => messaging().getToken();

export const onStudentPushTokenRefresh = (listener: (token: string) => void) =>
  messaging().onTokenRefresh(listener);

export const onStudentPushMessage = (
  listener: (message: { title?: string; body?: string }) => void,
) =>
  messaging().onMessage(async remoteMessage => {
    console.log('Push notification received', remoteMessage);

    listener({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
    });
  });
