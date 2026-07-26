import React, { useState } from 'react';
import { ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';

import { QuizScreen, Header } from '../component/index';
import Timer from '../component/Timer';
import { RootState } from '../store/store';
import { useEffect } from 'react';
import { CalulateStyles as styles } from './styles/Calulate.styles';

export default function Calculate() {
  const route = useRoute<any>();
  const questionId = useSelector((state: RootState) => state.common.questionId);
  const timer = useSelector((state: RootState) => state.common.timer);
  const returnRouteName = route.params?.returnRouteName;

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setTimeLeft(timer);
  }, [timer]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <Header heading="Quiz Challenge" sideHead={`⭐ Level ${questionId}`} />
      <ScrollView
        // style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} // hides scrollbar
        keyboardShouldPersistTaps="handled" // taps work while keyboard open
      >
        <Timer timeLeft={timeLeft} setTimeLeft={setTimeLeft} />
        <QuizScreen timer={timeLeft} returnRouteName={returnRouteName} />
      </ScrollView>
    </SafeAreaView>
  );
}
