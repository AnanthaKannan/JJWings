import * as Keychain from 'react-native-keychain';

import { generateDeviceId } from './fn';

const SAVED_LOGIN_SERVICE = 'com.jjwings.saved-login';
const DEVICE_ID_SERVICE = 'com.jjwings.deviceId';

export type SavedLoginCredentials = {
  studentId: string;
  password: string;
};

export const saveLoginCredentials = async ({
  studentId,
  password,
}: SavedLoginCredentials) => {
  await Keychain.setGenericPassword(studentId, password, {
    service: SAVED_LOGIN_SERVICE,
  });
};

export const getSavedLoginCredentials =
  async (): Promise<SavedLoginCredentials | null> => {
    const credentials = await Keychain.getGenericPassword({
      service: SAVED_LOGIN_SERVICE,
    });

    if (!credentials) {
      return null;
    }

    return {
      studentId: credentials.username,
      password: credentials.password,
    };
  };

export const clearSavedLoginCredentials = async () => {
  await Keychain.resetGenericPassword({ service: SAVED_LOGIN_SERVICE });
};

export const getDeviceId = async () => {
  // Try to read existing deviceId
  const existing = await Keychain.getGenericPassword({
    service: DEVICE_ID_SERVICE,
  });

  if (existing) {
    return existing.password; // already generated before
  }

  // First launch — generate and persist
  const newDeviceId = generateDeviceId();
  await Keychain.setGenericPassword('device', newDeviceId, {
    service: DEVICE_ID_SERVICE,
  });

  return newDeviceId;
};
