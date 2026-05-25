import * as Keychain from 'react-native-keychain';

const SAVED_LOGIN_SERVICE = 'com.jjwings.saved-login';

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
