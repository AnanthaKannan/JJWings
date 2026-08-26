export type Operator = '+' | '-';

export interface Question {
  id: string;
  a: number;
  b: number;
  operator: Operator;
  answer: number;
}

export type GamePhase = 'ready' | 'playing' | 'gameover';

export type GameLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GameLevelConfig {
  level: GameLevel;
  title: string;
  description: string;
  emoji: string;
  minMax: number;
  maxMax: number;
  allowSubtraction: boolean;
  subtractionChance: number;
  startFallDuration: number;
  minFallDuration: number;
  speedUpPerPoint: number;
}

export type UserType = 'admin' | 'student';

export interface BeadTheme {
  base: string;
  shine: string;
}

export type GenerateOtpReq = {
  email: string;
};

export type VerifyOtpReq = {
  email: string;
  otp: string;
};

export type VerifyPrefixReq = {
  type: UserType;
  prefix: string;
};

export type VerifyPrefixRes = GeneralResponse & {
  isPrefixAvailable: string;
};

export type CreateOrgReq = {
  name: string;
  studentPrefix: string;
  teacherPrefix: string;
  adminName: string;
  email: string;
};

export type AddGameScore = {
  level: number;
  points: number;
};

export type TopGamerDetail = {
  points: string;
  name: string;
  profilePic: string;
  studentId: string;
};

export type TopGameScoreByLevel = GeneralResponse & {
  result: TopGamerDetail[];
};

export type ScoreDetail = {
  data: {
    points: number;
  };
};

export type Feed = {
  _id: string;
  content?: string;
  type: string;
  commentCount: number;
  likeCount: number;
  adminName: string;
  adminPicPath: string;
  filePath: string;
  createdAt: string;
  createdBy: string;
  isPrivate: boolean;
  isLikedByMe: boolean;
};

export type Group = {
  _id: string;
  groupName: string;
  studentIds: { _id: string; name: string; profilePicPath: string }[];
};

export type SendGroupMessage = {
  message?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  groupId: string;
};

export type SaveGroupReq = {
  groupName: string;
  studentIds: string[];
};

type FilePath = 'feed' | 'profile' | 'message';

type FileType = 'content' | 'file';

export type UploadFileArg = {
  uri: string;
  type?: FileType;
  content?: string;
  path: FilePath;
  name?: string;
};

export type CreateContentArg = {
  type: FileType;
  content: string;
};

export type FeedData = GeneralResponse & {
  data: Feed[];
};

export type GroupResponse = GeneralResponse & {
  data?: Group[];
  result?: Group[];
};

export type GeneralResponse = {
  success: boolean;
  message: string;
};

export type UserTypeSch = 'Student' | 'Admin';

export type Comment = {
  _id: string;
  userDetail: {
    _id: string;
    name: string;
    profilePicPath: string;
  };
  userType: UserTypeSch;
  content: string;
  isBlocked: boolean;
  createdAt: string;
  approved: boolean;
};

export type ParentCommentRes = GeneralResponse & {
  data: Comment[];
};

export type GroupMessages = {
  text: string;
  voiceUrl?: string;
  voicePath?: string;
  voiceDuration?: number;
  _id: string;
  date: string;
};

export type GroupMessagesRes = GeneralResponse & {
  data: GroupMessages[];
};

export type NonApprovedComment = {
  _id: string;
  content: string;
  createdAt: string;
  approved: boolean;
  userDetail: {
    _id: string;
    name: string;
    profilePicPath: string;
  };
};

export type NonApprovedCommentRes = GeneralResponse & {
  data: NonApprovedComment[];
};

export type AdminDetails = {
  _id: string;
  name: string;
  profilePicPath: string;
};

export type CreateComment = {
  feedId: string;
  content: string;
};

export type LogOutArg = {
  deviceId: string;
  fcmToken: string | null;
};
