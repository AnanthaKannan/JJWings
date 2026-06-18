export const formatUploadLimit = (bytes: number) =>
  bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`;
