import { StyleSheet, ScrollView } from 'react-native';

import { QuizScreen, Header } from '../component/index';
import Timer from '../component/Timer';

export default function Calculate() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false} // hides scrollbar
      keyboardShouldPersistTaps="handled" // taps work while keyboard open
    >
      <Header playerName="Tactile Explorer" score={128} />
      <Timer totalTimeSeconds={165} />
      <QuizScreen />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    gap: 16,
    paddingHorizontal: 20,
  },
});
