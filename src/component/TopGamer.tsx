import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

import { Avatar, Loader } from '../component';
import { randomNumber } from '../util/fn';
import { TopGamerDetail } from '../types';

interface RisingStarsProps {
  students: TopGamerDetail[];
  isFetching: boolean;
}

const COLORSX = ['#E8A87C', '#7EB8D4'];

const TopGamer: React.FC<RisingStarsProps> = ({
  students = [],
  isFetching,
}) => {
  const renderItem = ({ item }: { item: TopGamerDetail }) => (
    <View style={styles.row}>
      <Avatar
        color={COLORSX[randomNumber(0, 1)]}
        name={item.name}
        profilePic={item.profilePic}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
      </View>

      <View style={styles.accuracyContainer}>
        <Text style={styles.accuracy}>{item.points}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Top 5 Gamer</Text>
      </View>

      {isFetching ? (
        <Loader />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.studentId}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EDEBFB',
    width: '100%',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1A3B',
  },
  rankPill: {
    backgroundColor: '#D6D3F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4A8C',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  rank: {
    width: 24,
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1A3B',
    textAlign: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1A3B',
    marginHorizontal: 10,
  },
  level: {
    fontSize: 12,
    color: '#8B8AA8',
    marginTop: 2,
  },
  accuracyContainer: {
    alignItems: 'flex-end',
  },
  accuracy: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B5BFF',
    marginRight: 10,
  },
  accuracyLabel: {
    fontSize: 11,
    color: '#8B8AA8',
    marginTop: 2,
  },
});

export default TopGamer;
