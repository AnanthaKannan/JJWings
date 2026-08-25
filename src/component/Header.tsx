import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import StudentHeader from './StudentHeader';

interface HeaderProps {
  heading: string;
  sideHead: string;
  onBack?: () => void;
}

export default function Header({ heading, sideHead, onBack }: HeaderProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (heading === 'Quiz Review') {
      if (route.params?.preferGoBack && navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      const returnToHomeworkParams = route.params?.returnToHomeworkParams;
      const returnRouteName = route.params?.returnRouteName ?? 'HomeworkScreen';

      navigation.reset({
        index: 0,
        routes: [
          {
            name: returnRouteName,
            params: returnToHomeworkParams,
          },
        ],
      });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('HomeworkScreen');
  };

  return (
    <StudentHeader
      header={heading}
      sideHead={sideHead}
      showBackButton={true}
      onBack={handleBack}
      headerBackgroundColor="null"
    />
  );
}
