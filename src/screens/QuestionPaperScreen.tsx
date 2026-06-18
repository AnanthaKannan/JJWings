import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import {
  AdminHeader,
  LoadingOverlay,
  LoadingState,
  StudentHeader,
} from '../component';
import {
  QuestionPaper,
  useDeleteQuestionPaperMutation,
  useGetQuestionPapersQuery,
  useLazyGetQuestionPaperDownloadQuery,
  useUploadQuestionPaperMutation,
} from '../store/api';
import { RootState } from '../store/store';
import { getFileUrl } from '../util/fileUrl';

const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatFileFormat = (format?: string, mimeType?: string) => {
  const value = format ?? mimeType?.split('/').pop();
  const cleanValue = value?.split('/').pop();
  return cleanValue ? cleanValue.toUpperCase() : '';
};

const PaperSeparator = () => <View style={styles.separator} />;
const DOWNLOAD_FOLDER = 'JJ Wings';

const getDownloadFileName = (paper: QuestionPaper) => {
  const fallbackName = paper.originalName ?? paper.name ?? 'question-paper';
  const safeName = fallbackName.replace(/[\\/:*?"<>|]+/g, '-').trim();

  if (/\.[a-z0-9]{2,}$/i.test(safeName)) return safeName;

  const fileType = paper.fileFormat ?? paper.mimeType;
  const extension =
    fileType === 'application/pdf' ? 'pdf' : fileType?.split('/').pop();
  return extension ? `${safeName}.${extension}` : safeName;
};

const getDownloadMimeType = (paper: QuestionPaper) => {
  const fileType = paper.fileFormat ?? paper.mimeType;

  if (!fileType) return 'application/pdf';
  if (fileType.includes('/')) return fileType;

  return fileType.toLowerCase() === 'pdf'
    ? 'application/pdf'
    : 'application/octet-stream';
};

const QuestionPaperRow = ({
  item,
  isAdmin,
  onDownload,
  onDelete,
}: {
  item: QuestionPaper;
  isAdmin: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) => (
  <View style={styles.paperRow}>
    <View style={styles.fileIcon}>
      <MaterialIcons name="description" size={22} color="#4F46E5" />
    </View>
    <View style={styles.fileInfo}>
      <Text style={styles.fileName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.fileMeta} numberOfLines={1}>
        {[
          item.originalName,
          formatFileFormat(item.fileFormat, item.mimeType),
          formatFileSize(item.fileSize ?? item.size),
        ]
          .filter(Boolean)
          .join(' | ')}
      </Text>
    </View>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={onDownload}
      activeOpacity={0.82}
    >
      <MaterialIcons name="file-download" size={21} color="#2563EB" />
    </TouchableOpacity>
    {isAdmin && (
      <TouchableOpacity
        style={[styles.iconButton, styles.deleteIconButton]}
        onPress={onDelete}
        activeOpacity={0.82}
      >
        <MaterialIcons name="delete-outline" size={21} color="#B91C1C" />
      </TouchableOpacity>
    )}
  </View>
);

export default function QuestionPaperScreen() {
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const isStudent = useSelector((state: RootState) => state.common.isStudent);
  const token = useSelector((state: RootState) => state.common.token);
  const [paperName, setPaperName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const {
    data: papers = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetQuestionPapersQuery();
  const [uploadQuestionPaper, uploadResult] = useUploadQuestionPaperMutation();
  const [deleteQuestionPaper, deleteResult] = useDeleteQuestionPaperMutation();
  const [getDownloadUrl, downloadResult] =
    useLazyGetQuestionPaperDownloadQuery();
  const isBusy =
    uploadResult.isLoading ||
    deleteResult.isLoading ||
    downloadResult.isFetching ||
    downloadingId !== null;
  const showLoader = isLoading && papers.length === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleUpload = async () => {
    const cleanName = paperName.trim();

    if (!cleanName) {
      Alert.alert('Name required', 'Please enter a question paper name.');
      return;
    }

    try {
      const [file] = await pick({
        allowMultiSelection: false,
        type: [types.pdf, types.doc, types.docx, types.images],
      });

      if (!file?.uri) {
        Alert.alert('No file selected', 'Please choose a file to upload.');
        return;
      }

      await uploadQuestionPaper({
        name: cleanName,
        file: {
          uri: file.uri,
          type: file.type ?? undefined,
          name: file.name ?? cleanName,
        },
      }).unwrap();

      setPaperName('');
      Alert.alert('Uploaded', 'Question paper uploaded successfully.');
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      console.error('Failed to upload question paper', error);
      Alert.alert(
        'Upload failed',
        'Please try uploading the question paper again.',
      );
    }
  };

  const handleDelete = (paper: QuestionPaper) => {
    Alert.alert(
      'Delete question paper?',
      `${paper.name} will be removed from the list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuestionPaper(paper.id).unwrap();
            } catch (error) {
              console.error('Failed to delete question paper', error);
              Alert.alert(
                'Delete failed',
                'Please try deleting the question paper again.',
              );
            }
          },
        },
      ],
    );
  };

  const handleDownload = async (paper: QuestionPaper) => {
    try {
      setDownloadingId(paper.id);
      const downloadUrlValue = await getDownloadUrl(paper.id).unwrap();
      const downloadUrl = getFileUrl(downloadUrlValue) ?? downloadUrlValue;

      if (!downloadUrl) {
        Alert.alert('Unable to download', 'No file link was found.');
        return;
      }

      const fileName = getDownloadFileName(paper);
      const mimeType = getDownloadMimeType(paper);
      const headers: Record<string, string> | undefined = token
        ? { Accept: mimeType, 'x-access-token': token }
        : { Accept: mimeType };

      if (Platform.OS === 'android') {
        const response = await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mediaScannable: true,
            title: fileName,
            description: 'Question paper downloaded',
            path: `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${DOWNLOAD_FOLDER}/${fileName}`,
            mime: mimeType,
          },
        }).fetch('GET', downloadUrl, headers);
        const status = response.info().status;

        if (status < 200 || status >= 300) {
          throw new Error(`Download request failed with status ${status}`);
        }

        const downloadedUri = response.path();
        Alert.alert(
          'Downloaded',
          `${fileName} has been saved to Android Downloads.`,
          [
            { text: 'OK' },
            {
              text: 'Open',
              onPress: () => {
                ReactNativeBlobUtil.android
                  .actionViewIntent(downloadedUri, mimeType)
                  .catch(error => {
                    console.error(
                      'Failed to open downloaded question paper',
                      error,
                    );
                  });
              },
            },
          ],
        );
      } else {
        const response = await ReactNativeBlobUtil.config({
          fileCache: true,
          appendExt: fileName.split('.').pop() ?? 'pdf',
        }).fetch('GET', downloadUrl, headers);
        const status = response.info().status;

        if (status < 200 || status >= 300) {
          throw new Error(`Download request failed with status ${status}`);
        }

        const path = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
        await ReactNativeBlobUtil.fs.cp(response.path(), path);
        ReactNativeBlobUtil.ios.openDocument(path);
        Alert.alert('Downloaded', `${fileName} has been saved.`);
      }
    } catch (error) {
      console.error('Failed to download question paper', error);
      Alert.alert(
        'Download failed',
        'Please try downloading the question paper again.',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const header = isAdmin ? (
    <AdminHeader header="Question Papers" />
  ) : (
    <StudentHeader header="Question Papers" headerBackgroundColor="#EEF2FF" />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      {header}

      <View style={styles.content}>
        {isAdmin && (
          <View style={styles.uploadCard}>
            <Text style={styles.inputLabel}>Question paper name</Text>
            <TextInput
              style={styles.nameInput}
              value={paperName}
              onChangeText={setPaperName}
              placeholder="e.g. Algebra Practice Set"
              placeholderTextColor="#94A3B8"
              editable={!isBusy}
            />
            <TouchableOpacity
              style={[
                styles.uploadButton,
                paperName.trim().length === 0 && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={isBusy || paperName.trim().length === 0}
              activeOpacity={0.84}
            >
              <MaterialIcons name="upload-file" size={20} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listCard}>
          {showLoader ? (
            <LoadingState label="Loading question papers..." />
          ) : (
            <FlatList
              data={papers}
              keyExtractor={item => item.id}
              contentContainerStyle={[
                styles.listContent,
                papers.length === 0 && styles.emptyListContent,
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing || isFetching}
                  onRefresh={onRefresh}
                  tintColor="#4F46E5"
                  colors={['#4F46E5']}
                  progressBackgroundColor="#EEF2FF"
                />
              }
              renderItem={({ item }) => (
                <QuestionPaperRow
                  item={item}
                  isAdmin={isAdmin}
                  onDownload={() => handleDownload(item)}
                  onDelete={() => handleDelete(item)}
                />
              )}
              ItemSeparatorComponent={PaperSeparator}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="folder-open" size={38} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No question papers yet</Text>
                  <Text style={styles.emptyText}>
                    {isStudent
                      ? 'Question papers will appear here once uploaded.'
                      : 'Upload a file to share it with students.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      <LoadingOverlay visible={isBusy} label="Processing question papers..." />
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  nameInput: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  uploadButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  listCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  listContent: {
    padding: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  paperRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  fileMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButton: {
    backgroundColor: '#FEE2E2',
  },
  separator: {
    height: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
});
