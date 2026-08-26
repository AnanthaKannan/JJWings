import React, { useState } from 'react';
import {
  Modal,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../store/store';
import { getFileUrl } from '../util/fileUrl';
import { APP_VERSION } from '../util/version';

type AdminHeaderProps = {
  header: string;
  showBackButton?: boolean;
  headerBackgroundColor?: string;
  onBackPress?: () => void;
};

type AdminNavItem = {
  label: string;
  icon: string;
  routeName: string;
  params?: object;
  requiresRole?: string;
  expired?: boolean;
};

const adminNavItems: AdminNavItem[] = [
  {
    label: 'Rank',
    icon: 'leaderboard',
    routeName: 'AdminRanking',
  },
  // {
  //   label: 'Question Papers',
  //   icon: 'description',
  //   routeName: 'AdminQuestionPapers',
  // },
  {
    label: 'Feeds',
    icon: 'view-agenda',
    routeName: 'AdminAchievements',
    requiresRole: 'superadmin',
  },
  {
    label: 'Add Student',
    icon: 'person-add',
    routeName: 'AdminStudents',
    params: { screen: 'AddStudent' },
  },
  {
    label: 'Add Teachers',
    icon: 'school',
    routeName: 'AdminTeachers',
    requiresRole: 'superadmin',
  },
  {
    label: 'Comment Approval',
    icon: 'pending-actions',
    routeName: 'CommentApproval',
  },
  {
    label: 'Update Password',
    icon: 'lock-reset',
    routeName: 'UpdatePassword',
  },
  {
    label: 'Profile',
    icon: 'person',
    routeName: 'AdminProfile',
  },
  {
    label: 'Billing',
    icon: 'attach-money',
    routeName: 'BillingRevenue',
    requiresRole: 'superadmin',
    expired: false,
  },
  {
    label: 'Logout',
    icon: 'logout',
    routeName: 'Logout',
    expired: false,
  },
];

export default function AdminHeader({
  header,
  showBackButton,
  headerBackgroundColor,
  onBackPress,
}: AdminHeaderProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { adminName, adminRoles, isAdmin, adminProfilePic, expired } =
    useSelector((state: RootState) => state.common);
  const adminInitial = (adminName.trim()[0] ?? 'A').toUpperCase();
  const displayName = adminName.trim() || 'Admin';
  const profilePicUrl = getFileUrl(adminProfilePic);
  const androidHeaderTopPadding =
    Platform.OS === 'android' ? Math.max(12, insets.top) : 12;
  const androidSideNavTopPadding =
    Platform.OS === 'android' ? Math.max(18, insets.top) : 18;
  const headerStyle = [
    styles.header,
    Platform.OS === 'android' && { paddingTop: androidHeaderTopPadding },
    headerBackgroundColor && { backgroundColor: headerBackgroundColor },
  ];

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
    <View style={headerStyle}>
      <TouchableOpacity
        onPress={() => {
          if (!showBackButton) return;

          if (onBackPress) {
            onBackPress();
            return;
          }

          navigation.goBack();
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
          {profilePicUrl ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={styles.profileImage}
            />
          ) : (
            <Text style={styles.profileInitial}>{adminInitial}</Text>
          )}
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
            <View
              style={[
                styles.sideNav,
                Platform.OS === 'android' && {
                  paddingTop: androidSideNavTopPadding,
                },
              ]}
            >
              <View style={styles.sideNavHeader}>
                <View style={styles.largeProfileCircle}>
                  {profilePicUrl ? (
                    <Image
                      source={{ uri: profilePicUrl }}
                      style={styles.largeProfileImage}
                    />
                  ) : (
                    <Text style={styles.largeProfileInitial}>
                      {adminInitial}
                    </Text>
                  )}
                </View>
                <View style={styles.adminTextWrap}>
                  <Text style={styles.adminName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.adminRole}>{adminRoles?.toString()}</Text>
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
                style={styles.navScroll}
                contentContainerStyle={styles.navList}
                showsVerticalScrollIndicator={false}
              >
                {adminNavItems
                  .filter(
                    item =>
                      (!item.requiresRole ||
                        adminRoles.includes(item.requiresRole)) &&
                      item.expired === !expired,
                  )
                  .map(item => (
                    <TouchableOpacity
                      key={item.label}
                      style={styles.navItem}
                      onPress={() =>
                        handleNavigate(item.routeName, item.params)
                      }
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

              <Text style={styles.versionText}>v{APP_VERSION}</Text>
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
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
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
    paddingBottom: 14,
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
    overflow: 'hidden',
  },
  largeProfileImage: {
    width: '100%',
    height: '100%',
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
    flexGrow: 1,
  },
  navScroll: {
    flex: 1,
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
  versionText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});
