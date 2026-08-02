import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker'; // adjust to your actual picker import
import { compressAchievementImage } from '../util/profileImage';
import { useCreateFeedMutation } from '../store/api'; // adjust to your actual RTK Query slice
import { IMAGE_UPLOAD_LIMITS } from '../config/imageUpload';
import { formatUploadLimit } from '../util/formatUploadLimit';

interface SelectedImage {
  uri: string;
  type: string;
  name: string;
}

export interface CreatePostScreenProps {
  userName: string;
  userAvatarUri?: string;
  onClose: () => void;
  /** Called after a successful post, e.g. to refetch the feed */
  onPosted?: () => void;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  userName,
  userAvatarUri,
  onClose,
  onPosted,
}) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [createFeed, { isLoading: isPosting }] = useCreateFeedMutation();

  const canPost = content.trim().length > 0 || !!selectedImage;

  const handlePickImage = useCallback(async () => {
    try {
      const [file] = await pick({
        allowMultiSelection: false,
        type: [types.images],
      });

      if (!file?.uri) {
        return;
      }

      setIsPreparingImage(true);
      const compressedImage = await compressAchievementImage({
        uri: file.uri,
        fileName: file.name ?? undefined,
      });

      setSelectedImage({
        uri: compressedImage.uri,
        type: compressedImage.type,
        name: compressedImage.name,
      });
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      console.error('Failed to prepare post image', error);
      Alert.alert(
        'Image failed',
        error instanceof Error &&
          error.message === 'ACHIEVEMENT_IMAGE_TOO_LARGE'
          ? `Please choose a smaller image. Images must be under ${formatUploadLimit(
              IMAGE_UPLOAD_LIMITS.achievementMaxBytes,
            )}.`
          : 'Please try selecting the image again.',
      );
    } finally {
      setIsPreparingImage(false);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handlePost = useCallback(async () => {
    if (!canPost) {
      Alert.alert('Nothing to post', 'Write something or add a photo first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', selectedImage ? 'file' : 'content');

      const trimmedContent = content.trim();
      if (trimmedContent) {
        formData.append('content', trimmedContent);
      }

      if (selectedImage) {
        // RN's FormData accepts this {uri, type, name} shape directly as a file part
        formData.append('file', {
          uri: selectedImage.uri,
          type: selectedImage.type,
          name: selectedImage.name,
        } as unknown as Blob);
      }

      // await createFeed(formData).unwrap();

      setContent('');
      setSelectedImage(null);
      onPosted?.();
      onClose();
    } catch (error) {
      console.error('Failed to create post', error);
      Alert.alert('Post failed', 'Please try posting again.');
    }
  }, [canPost, content, selectedImage, createFeed, onPosted, onClose]);

  const busy = isPreparingImage || isPosting;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>Create post</Text>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={8}
          >
            <MaterialIcons name="close" size={20} color="#050505" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.userRow}>
        {userAvatarUri ? (
          <Image source={{ uri: userAvatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{userName.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={`What's on your mind, ${userName.split(' ')[0]}?`}
        placeholderTextColor="#65676b"
        multiline
        value={content}
        onChangeText={setContent}
        editable={!busy}
      />

      {selectedImage && (
        <View style={styles.previewWrapper}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.previewImage}
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={handleRemoveImage}
            hitSlop={8}
            disabled={busy}
          >
            <MaterialIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.addToPostRow}>
        <Text style={styles.addToPostLabel}>Add to your post</Text>
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={busy}
          style={styles.photoButton}
          hitSlop={8}
        >
          {isPreparingImage ? (
            <ActivityIndicator size="small" color="#45bd62" />
          ) : (
            <MaterialIcons name="photo-library" size={24} color="#45bd62" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.postButton,
          (!canPost || busy) && styles.postButtonDisabled,
        ]}
        onPress={handlePost}
        disabled={!canPost || busy}
      >
        {isPosting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            style={[
              styles.postButtonText,
              (!canPost || busy) && styles.postButtonTextDisabled,
            ]}
          >
            Post
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  headerSide: {
    width: 32,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#050505',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e4e6eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    color: '#050505',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 140,
    height: 140,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e4e6eb',
    borderRadius: 10,
  },
  addToPostLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  photoButton: {
    width: 28,
    alignItems: 'center',
  },
  postButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#1877F2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#e4e6eb',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  postButtonTextDisabled: {
    color: '#bcc0c4',
  },
});

export default CreatePostScreen;
