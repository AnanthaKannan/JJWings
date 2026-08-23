import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useUpdateStudentFcmTokenMutation } from '../store/api';
import { RootState } from '../store/store';
import {
  getStudentPushToken as getPushToken,
  onStudentPushTokenRefresh as onPushTokenRefresh,
} from '../services/pushNotifications';

export default function PushNotificationRegistrar() {
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
