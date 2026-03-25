import { StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';

import { QuizScreen, Header } from '../component/index';
import Timer from '../component/Timer';

export default function Calculate() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <Header playerName="Tactile Explorer" score={128} />
      <ScrollView
        // style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} // hides scrollbar
        keyboardShouldPersistTaps="handled" // taps work while keyboard open
      >
        <Timer totalTimeSeconds={165} />
        <QuizScreen />
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
