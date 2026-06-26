import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LoadingState from './LoadingState';

type EmptyDataProps = {
  showLoader: boolean | undefined;
  loadingMessage: string;
  emptyTitle: string;
  emptyText: string;
  icon: string;
};

export default function EmptyData({
  showLoader,
  loadingMessage,
  emptyTitle,
  emptyText,
  icon,
}: EmptyDataProps) {
  return showLoader ? (
    <LoadingState label={loadingMessage} />
  ) : (
    <View style={styles.emptyState}>
      <MaterialIcons name={icon} size={42} color="#94A3B8" />
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 34,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
