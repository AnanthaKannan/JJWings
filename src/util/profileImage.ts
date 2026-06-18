import ImageResizer from '@bam.tech/react-native-image-resizer';

import { IMAGE_UPLOAD_LIMITS } from '../config/imageUpload';

type ImageAsset = {
  uri: string;
  fileName?: string;
};

type ResizeAttempt = {
  size: number;
  quality: number;
};

export type CompressedUploadImage = {
  uri: string;
  type: string;
  name: string;
  size: number;
};

const resizeAttempts = [
  { size: 512, quality: 80 },
  { size: 448, quality: 72 },
  { size: 384, quality: 64 },
  { size: 320, quality: 58 },
  { size: 256, quality: 52 },
  { size: 220, quality: 46 },
  { size: 180, quality: 40 },
  { size: 160, quality: 34 },
  { size: 144, quality: 30 },
  { size: 128, quality: 26 },
  { size: 112, quality: 22 },
];

const achievementResizeAttempts = [
  { size: 1280, quality: 82 },
  { size: 1120, quality: 76 },
  { size: 960, quality: 70 },
  { size: 800, quality: 64 },
  { size: 640, quality: 58 },
  { size: 520, quality: 50 },
  { size: 420, quality: 44 },
  { size: 360, quality: 38 },
];

const getJpegName = (fileName: string | undefined, fallbackName: string) => {
  const cleanName = fileName?.trim();
  if (!cleanName) return fallbackName;

  return cleanName.replace(/\.[^/.]+$/, '') + '.jpg';
};

const compressImageToMaxSize = async ({
  asset,
  maxBytes,
  attempts,
  fallbackName,
  errorCode,
}: {
  asset: ImageAsset;
  maxBytes: number;
  attempts: ResizeAttempt[];
  fallbackName: string;
  errorCode: string;
}): Promise<CompressedUploadImage> => {
  let smallestImage: CompressedUploadImage | null = null;

  for (const attempt of attempts) {
    const resized = await ImageResizer.createResizedImage(
      asset.uri,
      attempt.size,
      attempt.size,
      'JPEG',
      attempt.quality,
      0,
      null,
      false,
      { mode: 'cover', onlyScaleDown: true },
    );
    const compressed = {
      uri: resized.uri,
      type: 'image/jpeg',
      name: getJpegName(asset.fileName, fallbackName),
      size: resized.size,
    };

    if (!smallestImage || compressed.size < smallestImage.size) {
      smallestImage = compressed;
    }

    if (compressed.size <= maxBytes) {
      return compressed;
    }
  }

  if (smallestImage && smallestImage.size <= maxBytes) {
    return smallestImage;
  }

  throw new Error(errorCode);
};

export const compressProfileImage = async (
  asset: ImageAsset,
): Promise<CompressedUploadImage> =>
  compressImageToMaxSize({
    asset,
    maxBytes: IMAGE_UPLOAD_LIMITS.profileMaxBytes,
    attempts: resizeAttempts,
    fallbackName: 'profile.jpg',
    errorCode: 'PROFILE_IMAGE_TOO_LARGE',
  });

export const compressAchievementImage = async (
  asset: ImageAsset,
): Promise<CompressedUploadImage> =>
  compressImageToMaxSize({
    asset,
    maxBytes: IMAGE_UPLOAD_LIMITS.achievementMaxBytes,
    attempts: achievementResizeAttempts,
    fallbackName: 'celebration.jpg',
    errorCode: 'ACHIEVEMENT_IMAGE_TOO_LARGE',
  });
