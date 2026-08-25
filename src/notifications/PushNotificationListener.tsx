import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { jjWingsApi, useLazyGetUnreadMessageCountQuery } from '../store/api';
import {
  setMessageUnreadCount,
  showNotificationAttention,
} from '../store/slices';
import { RootState } from '../store/store';
import { onStudentPushMessage as onPushMessage } from '../services/pushNotifications';

export default function PushNotificationListener() {
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
      if (message.title?.toLowerCase() === 'new message') {
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
