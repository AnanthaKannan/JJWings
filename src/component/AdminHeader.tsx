import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../store/store';

type AdminHeaderProps = {
  header: string;
  showBackButton?: boolean;
};

const adminNavItems = [
  {
    label: 'Students',
    icon: 'people',
    routeName: 'AdminStudents',
    params: { screen: 'StudentDirectory' },
  },
  {
    label: 'Add Student',
    icon: 'person-add',
    routeName: 'AdminStudents',
    params: { screen: 'AddStudent' },
  },
  {
    label: 'Homework',
    icon: 'library-books',
    routeName: 'HomeworkLibrary',
  },
  {
    label: 'New Task',
    icon: 'playlist-add',
    routeName: 'CreateNewTask',
  },
  {
    label: 'Messages',
    icon: 'mail',
    routeName: 'AdminMessages',
  },
  {
    label: 'Notifications',
    icon: 'notifications',
    routeName: 'AdminNotifications',
  },
  {
    label: 'Profile',
    icon: 'account-circle',
    routeName: 'Logout',
  },
];

export default function AdminHeader({
  header,
  showBackButton,
}: AdminHeaderProps) {
  const navigation = useNavigation<any>();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const adminName = useSelector((state: RootState) => state.common.adminName);
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const adminInitial = (adminName.trim()[0] ?? 'A').toUpperCase();
  const displayName = adminName.trim() || 'Admin';

  const handleProfilePress = () => {
    if (isAdmin) {
      setIsNavOpen(true);
    }
  };

  const handleNavigate = (routeName: string, params?: object) => {
    setIsNavOpen(false);
    navigation.navigate(routeName, params);
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          if (showBackButton) navigation.goBack();
        }}
        style={styles.leftArea}
        disabled={!showBackButton}
        activeOpacity={0.75}
      >
        {showBackButton && (
          <MaterialIcons name="arrow-back" size={22} color="#1A202C" />
        )}
        <Text style={styles.brandName} numberOfLines={1}>
          {header}
        </Text>
      </TouchableOpacity>

      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileCircle}
          disabled={!isAdmin}
          activeOpacity={0.78}
        >
          <Text style={styles.profileInitial}>{adminInitial}</Text>
        </TouchableOpacity>
      </View>

      {isAdmin && (
        <Modal
          visible={isNavOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsNavOpen(false)}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setIsNavOpen(false)}
            />
            <View style={styles.sideNav}>
              <View style={styles.sideNavHeader}>
                <View style={styles.largeProfileCircle}>
                  <Text style={styles.largeProfileInitial}>{adminInitial}</Text>
                </View>
                <View style={styles.adminTextWrap}>
                  <Text style={styles.adminName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.adminRole}>Admin</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsNavOpen(false)}
                  style={styles.closeButton}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="close" size={21} color="#334155" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.navList}
                showsVerticalScrollIndicator={false}
              >
                {adminNavItems.map(item => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.navItem}
                    onPress={() => handleNavigate(item.routeName, item.params)}
                    activeOpacity={0.78}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={21}
                      color="#4F46E5"
                    />
                    <Text style={styles.navItemText}>{item.label}</Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FB',
  },
  leftArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  brandName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  sideNav: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 14,
  },
  sideNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  largeProfileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeProfileInitial: {
    color: '#4338CA',
    fontSize: 17,
    fontWeight: '900',
  },
  adminTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  adminName: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '900',
  },
  adminRole: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  navList: {
    paddingTop: 18,
    paddingBottom: 28,
    gap: 10,
  },
  navItem: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navItemText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 12,
  },
});
