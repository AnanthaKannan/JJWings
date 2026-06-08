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
      const returnToHomeworkParams = route.params?.returnToHomeworkParams;

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'HomeworkScreen',
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
    />
  );
}
