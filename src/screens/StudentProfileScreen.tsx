import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
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
import { StudentProfileScreenStyles as styles } from './styles/StudentProfileScreen.styles';

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
      Alert.alert(
        'Profile photo updated',
        'Your profile picture was uploaded.',
      );
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
              {studentLevel === null
                ? 'Student profile'
                : `Level ${studentLevel}`}
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
