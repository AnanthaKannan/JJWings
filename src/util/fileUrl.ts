import Config from 'react-native-config';

const FILE_URL = Config.FILE_URL?.replace(/\/$/, '') ?? '';

export const getFileUrl = (path?: string | null) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, '');
  return FILE_URL ? `${FILE_URL}/${cleanPath}` : cleanPath;
};
