import React, { useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';

import { QuizScreen, Header } from '../component/index';
import Timer from '../component/Timer';
import { RootState } from '../store/store';
import { useEffect } from 'react';

export default function Calculate() {
  const questionId = useSelector((state: RootState) => state.common.questionId);
  const timer = useSelector((state: RootState) => state.common.timer);

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setTimeLeft(timer);
  }, [timer]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <Header heading="Quiz Review" sideHead={`⭐ Level ${questionId}`} />
      <ScrollView
        // style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} // hides scrollbar
        keyboardShouldPersistTaps="handled" // taps work while keyboard open
      >
        <Timer timeLeft={timeLeft} setTimeLeft={setTimeLeft} />
        <QuizScreen timer={timeLeft} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  // content: {
  //   gap: 16,
  //   paddingHorizontal: 20,
  // },
});
