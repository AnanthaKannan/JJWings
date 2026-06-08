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
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../store/store';
import { getFileUrl } from '../util/fileUrl';
import { APP_VERSION } from '../util/version';

type StudentHeaderProps = {
  header: string;
  sideHead?: string;
  showBackButton?: boolean;
  headerBackgroundColor?: string;
  onBack?: () => void;
};

type StudentNavItem = {
  label: string;
  icon: string;
  routeName: string;
  params?: object;
};

const studentNavItems: StudentNavItem[] = [
  { label: 'Same Device', icon: 'devices-other', routeName: 'SameDeviceStudents' },
  { label: 'Question Papers', icon: 'description', routeName: 'QuestionPapers' },
  { label: 'Profile', icon: 'person', routeName: 'StudentProfile' },
  { label: 'Logout', icon: 'logout', routeName: 'Logout' },
];

export default function StudentHeader({
  header,
  sideHead,
  showBackButton,
  headerBackgroundColor,
  onBack,
}: StudentHeaderProps) {
  const navigation = useNavigation<any>();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const studentName = useSelector(
    (state: RootState) => state.common.studentName,
  );
  const studentLevel = useSelector(
    (state: RootState) => state.common.studentLevel,
  );
  const studentProfilePic = useSelector(
    (state: RootState) => state.common.studentProfilePic,
  );
  const isStudent = useSelector((state: RootState) => state.common.isStudent);
  const studentInitial = (studentName.trim()[0] ?? 'S').toUpperCase();
  const displayName = studentName.trim() || 'Student';
  const profilePicUrl = getFileUrl(studentProfilePic);
  const headerStyle = [
    styles.header,
    headerBackgroundColor && { backgroundColor: headerBackgroundColor },
  ];

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleNavigate = (routeName: string, params?: object) => {
    setIsNavOpen(false);
    navigation.dispatch(
      CommonActions.navigate({
        name: routeName,
        params,
      }),
    );
  };

  return (
    <View style={headerStyle}>
      <TouchableOpacity
        onPress={handleBack}
        style={styles.leftArea}
        disabled={!showBackButton}
        activeOpacity={0.75}
      >
        {showBackButton && (
          <MaterialIcons name="arrow-back" size={22} color="#1A202C" />
        )}
        {header.trim().length > 0 && (
          <Text style={styles.brandName} numberOfLines={1}>
            {header}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.headerRight}>
        {sideHead && (
          <View style={styles.sideBadge}>
            <Text style={styles.sideBadgeText} numberOfLines={1}>
              {sideHead}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => isStudent && setIsNavOpen(true)}
          style={styles.profileCircle}
          disabled={!isStudent}
          activeOpacity={0.78}
        >
          {profilePicUrl ? (
            <Image source={{ uri: profilePicUrl }} style={styles.profileImage} />
          ) : (
            <Text style={styles.profileInitial}>{studentInitial}</Text>
          )}
        </TouchableOpacity>
      </View>

      {isStudent && (
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
                  {profilePicUrl ? (
                    <Image
                      source={{ uri: profilePicUrl }}
                      style={styles.largeProfileImage}
                    />
                  ) : (
                    <Text style={styles.largeProfileInitial}>
                      {studentInitial}
                    </Text>
                  )}
                </View>
                <View style={styles.studentTextWrap}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.studentRole}>
                    {studentLevel === null ? 'Student' : `Level ${studentLevel}`}
                  </Text>
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
                {studentNavItems.map(item => (
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  brandName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  sideBadge: {
    maxWidth: 110,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sideBadgeText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '800',
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
  studentTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '900',
  },
  studentRole: {
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
