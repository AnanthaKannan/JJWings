import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export const useAndroidBackHandler = (onBack: () => void) => {
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          onBack();
          return true;
        },
      );

      return () => subscription.remove();
    }, [onBack]),
  );
};
