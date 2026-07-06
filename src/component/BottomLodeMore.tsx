import React from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';

type BottomLodeMoreProps = {
  loading: boolean | undefined;
};

export default function BottomLodeMore({ loading }: BottomLodeMoreProps) {
  return loading === true ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color="#2563EB" />
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 23,
  },
});
