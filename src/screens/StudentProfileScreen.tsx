import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';

import { LoadingOverlay, StudentHeader } from '../component';
import {
  useDeleteProfilePicMutation,
  useUploadProfilePicMutation,
} from '../store/api';
import { IMAGE_UPLOAD_LIMITS } from '../config/imageUpload';
import { setStudentProfilePic } from '../store/slices';
import { RootState } from '../store/store';
import { getFileUrl } from '../util/fileUrl';
import { formatUploadLimit } from '../util/formatUploadLimit';
import { compressProfileImage } from '../util/profileImage';

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

export default function StudentProfileScreen() {
  const dispatch = useDispatch();
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const studentCode = useSelector(
    (state: RootState) => state.common.studentCode,
  );
  const studentName = useSelector(
    (state: RootState) => state.common.studentName,
  );
  const studentLevel = useSelector(
    (state: RootState) => state.common.studentLevel,
  );
  const studentProfilePic = useSelector(
    (state: RootState) => state.common.studentProfilePic,
  );
  const [uploadProfilePic, uploadResult] = useUploadProfilePicMutation();
  const [deleteProfilePic, deleteResult] = useDeleteProfilePicMutation();
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const displayName = studentName.trim() || 'Student';
  const initial = (displayName[0] ?? 'S').toUpperCase();
  const profilePicUrl = getFileUrl(studentProfilePic);
  const isBusy =
    isPreparingPhoto || uploadResult.isLoading || deleteResult.isLoading;

  const details = useMemo(
    () => [
      { label: 'Name', value: displayName },
      { label: 'Account ID', value: studentCode ?? studentId ?? 'Unavailable' },
    ],
    [displayName, studentCode, studentId],
  );

  const handleUpload = async () => {
    let result;
    try {
      result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });
    } catch (error) {
      console.error('Failed to open image picker', error);
      Alert.alert(
        'Photo picker failed',
        'Please rebuild and reopen the app, then try choosing a photo again.',
      );
      return;
    }

    if (result.didCancel) return;

    if (result.errorCode) {
      Alert.alert(
        'Photo picker failed',
        result.errorMessage ?? 'Please try choosing a photo again.',
      );
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('No photo selected', 'Please choose a photo to upload.');
      return;
    }

    setIsPreparingPhoto(true);

    try {
      const compressedImage = await compressProfileImage({
        uri: asset.uri,
        fileName: asset.fileName,
      });

      if (studentProfilePic) {
        await deleteProfilePic().unwrap();
        dispatch(setStudentProfilePic(null));
      }

      const uploadedUrl = await uploadProfilePic({
        file: {
          uri: compressedImage.uri,
          type: compressedImage.type,
          name: compressedImage.name,
        },
      }).unwrap();

      dispatch(setStudentProfilePic(uploadedUrl ?? compressedImage.uri));
      Alert.alert('Profile photo updated', 'Your profile picture was uploaded.');
    } catch (error) {
      console.error('Failed to upload profile picture', error);
      Alert.alert(
        'Upload failed',
        error instanceof Error && error.message === 'PROFILE_IMAGE_TOO_LARGE'
          ? `Please choose a smaller photo. The profile picture must be under ${formatUploadLimit(
              IMAGE_UPLOAD_LIMITS.profileMaxBytes,
            )}.`
          : 'Please try uploading your profile picture again.',
      );
    } finally {
      setIsPreparingPhoto(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      <StudentHeader header="Profile" headerBackgroundColor="#EEF2FF" />

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.photoWrap}
            onPress={handleUpload}
            disabled={isBusy}
            activeOpacity={0.86}
          >
            {profilePicUrl ? (
              <Image source={{ uri: profilePicUrl }} style={styles.photo} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <MaterialIcons name="photo-camera" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileTextWrap}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.subtitle}>
              {studentLevel === null ? 'Student profile' : `Level ${studentLevel}`}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          {details.map(item => (
            <DetailRow key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>

      <LoadingOverlay visible={isBusy} label="Updating profile..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    marginBottom: 16,
  },
  photoWrap: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  photoEditBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 55,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  name: {
    color: '#1E293B',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  profileTextWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 18,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  detailRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'center',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  detailValue: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '900',
  },
});
