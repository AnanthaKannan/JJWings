// src/store/api.ts
import { createApi } from '@reduxjs/toolkit/query/react';

import { HomeworkState } from '../util/enum';
import { reduceMessageUnreadCount, setMessageUnreadCount } from './slices';
import { baseQuery, API_URL } from './baseQuery';
import {
  CreateOrgReq,
  GeneralResponse,
  GenerateOtpReq,
  VerifyOtpReq,
  VerifyPrefixReq,
  VerifyPrefixRes,
} from '../types';

const DEFAULT_LIMIT = 500;
const DEFAULT_NOTIFICATION_LIMIT = 20;
const DEFAULT_STUDENTS_LIMIT = 500;
const DEFAULT_QUESTIONS_LIMIT = 20;
const DEFAULT_HOMEWORK_LIMIT = 20;

type ApiMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiScore = {
  assigned?: number;
  new?: number;
  progress?: number;
  completed?: number;
  correct?: number;
  wrong?: number;
  timeTaken?: number;
  practiceAssigned?: number;
  practiceNew?: number;
  practiceProgress?: number;
  practiceCompleted?: number;
  practiceCorrect?: number;
  practiceWrong?: number;
  practiceTimeTaken?: number;
};

type ApiStudent = {
  _id: string;
  studentId?: string;
  name?: string;
  level?: number;
  profilePicPath?: string;
  vertical?: boolean;
  deviceIds?: string[];
  fcmToken?: string;
  fcmTokens?: string[];
  score?: ApiScore;
  isDeleted: boolean;
};

type ApiQuestion = {
  _id: string;
  questionId?: string;
  questions?: string[];
  marks?: number[];
  level?: number;
  oral?: boolean;
  updatedAt?: string;
};

type ApiHomework = {
  _id: string;
  studentId: string;
  questionId: ApiQuestion | string;
  state?: 'PROGRESS' | 'NEW' | 'COMPLETED';
  results?: boolean[];
  answers?: Array<number | string>;
  timer?: number;
  oral?: boolean;
  updatedAt?: string;
};

type ApiStudentsResponse = {
  students: ApiStudent[];
  meta: ApiMeta;
};

type ApiSameDeviceStudentsResponse = {
  students: ApiStudent[];
  count: number;
};

type ApiQuestionsResponse = {
  questions: ApiQuestion[];
  meta: ApiMeta;
};

type ApiHomeworksResponse = {
  homeworks: ApiHomework[];
  meta: ApiMeta;
};

type ApiHomeworkResponse = {
  homework?: ApiHomework;
};

type ApiNotification = {
  _id: string;
  messageHeader?: string;
  messageBody?: string;
  sentBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiNotificationsResponse = {
  data: ApiNotification[];
  meta: ApiMeta;
};

type ApiMessageParticipant = {
  _id: string;
  name?: string;
  adminId?: string;
  studentId?: string;
  profilePicPath?: string;
};

type ApiMessage = {
  _id: string;
  message?: string;
  sendBy: ApiMessageParticipant;
  sendByModel: 'Admin' | 'Student' | string;
  receivedTo: ApiMessageParticipant;
  receivedToModel: 'Admin' | 'Student' | string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiMessagesResponse = {
  data: ApiMessage[];
  meta: ApiMeta;
};

type ApiMessageStudent = {
  _id: string;
  studentId?: string;
  name?: string;
  level?: number;
  profilePicPath?: string;
  unreadMessageCount?: number;
};

type ApiMessageStudentsResponse = {
  students: ApiMessageStudent[];
  meta: ApiMeta;
};

type ApiUnreadMessageCountResponse = {
  unreadCount?: number;
  data?: {
    unreadCount?: number;
  };
};

type ApiRankingStudent = {
  totalCorrect?: number;
  totalQuestions?: number;
  totalTimer?: number;
  completedCount?: number;
  accuracy?: number;
  rank: number;
  studentId: string;
  name?: string;
  studentCode?: string;
  profilePicPath?: string;
};

type ApiRankingResponse = {
  data: ApiRankingStudent[];
};

type ApiFileUpload = {
  _id?: string;
  id?: string;
  name?: string;
  path?: string;
  url?: string;
  filePath?: string;
  fileUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  fileSize?: number;
  fileFormat?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiFileUploadsResponse =
  | ApiFileUpload[]
  | {
      data?: ApiFileUpload[];
      files?: ApiFileUpload[];
      fileUploads?: ApiFileUpload[];
    };

export type Student = {
  id: string;
  name: string;
  studentId?: string;
  level?: number;
  profilePicPath?: string;
  fcmTokens: string[];
  horizontal: boolean;
  assigned: number;
  completed: number;
  new: number;
  progress: number;
  success: number;
  failure: number;
  isDeleted: boolean;
};

export type SameDeviceStudent = {
  id: string;
  name: string;
  studentId?: string;
  profilePicPath?: string;
  deviceIds: string[];
  horizontal: boolean;
};

export type Question = {
  question?: string[];
  marks?: number[];
};

export type QuestionTask = {
  id: string;
  questionId?: string;
  question: string[];
  marks?: number[];
  level?: number;
  oral?: boolean;
  updatedAt?: string;
};

export type Homework = {
  id: string;
  studentId: string;
  questionId: string;
  questionLabel?: string;
  question?: Question;
  state: 'PROGRESS' | 'NEW' | 'COMPLETED';
  result: boolean[];
  answer: number[];
  timer: number;
  oral: boolean;
  updatedAt?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  sender?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type IdGenData = {
  studentLastID: number;
};

export type Score = {
  studentId: string;
  assigned: number;
  new: number;
  progress: number;
  success: number;
  failure: number;
  timeTaken: number;
  completed: number;
  practiceAssigned: number;
  practiceNew: number;
  practiceProgress: number;
  practiceCompleted: number;
  practiceSuccess: number;
  practiceFailure: number;
  practiceTimeTaken: number;
};

export type RankingStudent = {
  id: string;
  rank: number;
  name: string;
  studentCode?: string;
  profilePicPath?: string;
  totalCorrect: number;
  totalQuestions: number;
  totalTimer: number;
  completedCount: number;
  accuracy: number;
};

export type QuestionPaper = {
  id: string;
  name: string;
  path?: string;
  url?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  fileSize?: number;
  fileFormat?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MessageParticipant = {
  id: string;
  name: string;
  code?: string;
  model: string;
  profilePicPath?: string;
};

export type ChatMessage = {
  id: string;
  message: string;
  sendBy: MessageParticipant;
  receivedTo: MessageParticipant;
  createdAt?: string;
  updatedAt?: string;
};

export type MessageStudent = {
  id: string;
  studentId?: string;
  name: string;
  level?: number;
  profilePicPath?: string;
  unreadMessageCount: number;
};

export type Achievement = QuestionPaper;

type LoginArg = {
  username: string;
  password: string;
  deviceId?: string;
};

type SwitchStudentLoginArg = {
  studentId: string;
};

type LoginApiResponse = {
  success: boolean;
  message: string;
  token: string;
  role: 'student' | 'admin';
  orgId: string;
  user: {
    id: string;
    name: string;
    studentId?: string;
    adminId?: string;
    roles?: string[];
    level?: number;
    profilePicPath?: string;
    vertical: boolean;
  };
};

type LoginResult = {
  id: string;
  studentCode?: string;
  adminCode?: string;
  name: string;
  role: 'student' | 'admin';
  roles: string[];
  orgId: string;
  token: string;
  level?: number;
  profilePicPath?: string;
  vertical: boolean;
};

type UploadFile = {
  uri: string;
  type?: string;
  name?: string;
};

type UploadQuestionPaperArg = {
  file: UploadFile;
  name: string;
};

type UploadAchievementArg = {
  file: UploadFile;
};

type UploadProfilePicArg = {
  file: UploadFile;
};

type UploadResponse = {
  url?: string;
  path?: string;
  fileUrl?: string;
  location?: string;
  profilePicPath?: string;
  file?: {
    url?: string;
    path?: string;
  };
  data?: {
    url?: string;
    path?: string;
    fileUrl?: string;
    location?: string;
    profilePicPath?: string;
  };
};

type DownloadResponse =
  | string
  | {
      url?: string;
      downloadUrl?: string;
      path?: string;
      file?: {
        url?: string;
        path?: string;
      };
      data?: {
        url?: string;
        downloadUrl?: string;
        path?: string;
      };
    };

type HomeworkArg = {
  studentId: string;
  state: 'PROGRESS' | 'NEW' | 'COMPLETED';
  type?: 'homework' | 'exam' | 'practice';
  page?: number;
  limit?: number;
};

type HomeworksResult = {
  homeworks: Homework[];
  meta: ApiMeta;
};

type HomeworkByIdArg = {
  homeworkId: string;
};

type ScoreArg = {
  studentId: string;
};

type StudentsArg = {
  level?: number;
  page?: number;
  limit?: number;
};

type AddStudentArg = {
  name: string;
  level: number;
};

type UpdateStudentArg = {
  studentId: string;
  name?: string;
  level?: number;
  isDeleted?: boolean;
  horizontal?: boolean;
};

type ApiAdmin = {
  _id: string;
  adminId: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
};

type ApiAdminsResponse =
  | ApiAdmin[]
  | {
      data?: ApiAdmin[];
      admins?: ApiAdmin[];
      meta?: ApiMeta;
    };

export type Admin = {
  id: string;
  adminId: string;
  name: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminsResult = {
  admins: Admin[];
  meta?: ApiMeta;
};

type AddTeacherArg = {
  name: string;
};

type UpdateTeacherArg = {
  teacherId: string;
  name?: string;
  isDeleted?: boolean;
};

type UpdateStudentFcmTokenArg = {
  fcmToken: string;
};

type UpdatePasswordArg = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type ResetPasswordArg = {
  studentId: string;
};

type ResetPasswordResponse = {
  success?: boolean;
  message?: string;
  data?: {
    studentId?: string;
    name?: string;
    password?: string;
  };
};

export type addAdminResponse = {
  success: boolean;
  message: string;
  data: {
    adminId: string;
    password: string;
  };
};

export type addStudentResponse = {
  success: boolean;
  message: string;
  student: {
    name: string;
    studentId: string;
    password: string;
  };
};

type UpdateStudentDeviceIdArg = {
  deviceId: string;
  authToken?: string;
};

type DeleteStudentDeviceIdArg = {
  studentId: string;
  deviceId: string;
};

type RemoveStudentFcmTokenArg = {
  studentId: string;
  fcmToken: string;
};

type UpdateHomeworkArg = {
  homeworkId: string;
  state: 'PROGRESS' | 'NEW' | 'COMPLETED';
  result: boolean[];
  answer: number[];
  timer: number;
  success?: number;
  failure?: number;
};

type CreateQuestionArg = {
  taskId: string;
  question: string[];
  level: number;
  type: 'homework' | 'exam' | 'practice';
  marks?: number[];
  oral?: boolean;
};

type DeleteQuestionArg = {
  questionId: string;
};

type QuestionsArg = {
  level?: number;
  type?: 'homework' | 'exam' | 'practice';
  search?: string;
  page?: number;
  limit?: number;
};

type QuestionsResult = {
  questions: QuestionTask[];
  meta: ApiMeta;
};

type UpdateQuestionArg = {
  id: string;
  questionId: string;
  level: number;
};

type AssignHomeworkArg = {
  studentId?: string;
  levels?: number[];
  questionIds: string[];
};

export type AssignmentQuestion = {
  id: string;
  questionId?: string;
  type?: 'homework' | 'exam' | 'practice' | string;
};

export type AssignmentStudentResult = {
  id: string;
  studentId?: string;
  name: string;
  level?: number;
  assignedQuestionIds: string[];
  assignedQuestions: AssignmentQuestion[];
  skippedQuestionIds: string[];
  skippedQuestions: AssignmentQuestion[];
};

export type AssignHomeworkResult = {
  success: boolean;
  message?: string;
  assignedCount: number;
  skippedCount: number;
  students: AssignmentStudentResult[];
  notifications?: {
    sentCount?: number;
    totalRequested?: number;
  };
};

type UnassignHomeworkArg = {
  studentId: string;
  questionIds: string[];
};

type AssignPracticeQuestionsArg = {
  questionIds: string[];
  studentId?: string;
};

type UnassignPracticeQuestionsArg = {
  questionIds: string[];
  studentId?: string;
};

type AvailableQuestionsArg = {
  studentId: string;
  level?: number;
  type?: 'homework' | 'exam' | 'practice';
  page?: number;
  limit?: number;
};

type RankingArg = {
  level?: number;
};

type NotificationsArg = {
  studentId: string;
  page?: number;
  limit?: number;
};

type AdminNotificationsArg = {
  page?: number;
  limit?: number;
};

export type NotificationsResult = {
  notifications: Notification[];
  meta: ApiMeta;
};

export type StudentsResult = {
  students: Student[];
  meta: ApiMeta;
};

type SendNotificationArg = {
  studentIds: Array<{
    id: string;
  }>;
  messageHeader: string;
  messageBody: string;
};

type SendMessageArg = {
  message: string;
  receivedTo: string;
};

type ReadMessagesArg = {
  studentId: string;
};

const mapStudent = (student: ApiStudent): Student => ({
  id: student._id,
  name: student.name ?? '',
  studentId: student.studentId,
  level: student.level,
  profilePicPath: student.profilePicPath,
  fcmTokens: [
    ...(student.fcmTokens ?? []),
    ...(student.fcmToken ? [student.fcmToken] : []),
  ],
  horizontal: !(student.vertical ?? true),
  assigned: student.score?.assigned ?? 0,
  completed: student.score?.completed ?? 0,
  new: student.score?.new ?? 0,
  progress: student.score?.progress ?? 0,
  success: student.score?.correct ?? 0,
  failure: student.score?.wrong ?? 0,
  isDeleted: student.isDeleted,
});

const mapLogin = (response: LoginApiResponse): LoginResult => {
  return {
    id: response.user.id,
    studentCode: response.user.studentId,
    adminCode: response.user.adminId,
    name: response.user.name,
    role: response.role,
    roles: response.user.roles ?? [],
    orgId: response.orgId,
    token: response.token,
    level: response.user.level,
    profilePicPath: response.user.profilePicPath,
    vertical: response.user.vertical,
  };
};

const getTeachersFromResponse = (response: ApiAdminsResponse): ApiAdmin[] =>
  response?.admins ?? [];

const mapTeacher = (admin: ApiAdmin): Admin => ({
  id: admin._id,
  adminId: admin.adminId,
  name: admin.name ?? '',
  isDeleted: admin.isDeleted ?? false,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

const mapSameDeviceStudent = (student: ApiStudent): SameDeviceStudent => ({
  id: student._id,
  name: student.name ?? '',
  studentId: student.studentId,
  profilePicPath: student.profilePicPath,
  deviceIds: student.deviceIds ?? [],
  horizontal: !(student.vertical ?? true),
});

const mapQuestion = (question: ApiQuestion): QuestionTask => ({
  id: question._id,
  questionId: question.questionId,
  question: question.questions ?? [],
  marks: question.marks,
  level: question.level,
  oral: question.oral ?? false,
  updatedAt: question.updatedAt,
});

const mapHomework = (homework: ApiHomework): Homework => {
  const question =
    typeof homework.questionId === 'string' ? undefined : homework.questionId;
  const questionId =
    typeof homework.questionId === 'string'
      ? homework.questionId
      : homework.questionId._id;

  return {
    id: homework._id,
    studentId: homework.studentId,
    questionId,
    questionLabel: question?.questionId,
    question: {
      question: question?.questions ?? [],
      marks: question?.marks,
    },
    state: homework.state ?? HomeworkState.NEW,
    result: homework.results ?? [],
    answer: (homework.answers ?? []).map(Number),
    timer: homework.timer ?? 0,
    oral: question?.oral ?? homework.oral ?? false,
    updatedAt: homework.updatedAt,
  };
};

const mapNotification = (notification: ApiNotification): Notification => ({
  id: notification._id,
  title: notification.messageHeader ?? '',
  message: notification.messageBody ?? '',
  sender: notification.sentBy,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const mergeNotificationsResult = (
  currentCache: NotificationsResult,
  newPage: NotificationsResult,
) => {
  if (newPage.meta.page === 1) {
    currentCache.notifications = newPage.notifications;
    currentCache.meta = newPage.meta;
    return;
  }

  const existingIds = new Set(
    currentCache.notifications.map(notification => notification.id),
  );
  const newNotifications = newPage.notifications.filter(
    notification => !existingIds.has(notification.id),
  );

  currentCache.notifications.push(...newNotifications);
  currentCache.meta = newPage.meta;
};

const mergeStudentsResult = (
  currentCache: StudentsResult,
  newPage: StudentsResult,
) => {
  if (newPage.meta.page === 1) {
    currentCache.students = newPage.students;
    currentCache.meta = newPage.meta;
    return;
  }

  const existingIds = new Set(currentCache.students.map(student => student.id));
  const newStudents = newPage.students.filter(
    student => !existingIds.has(student.id),
  );

  currentCache.students.push(...newStudents);
  currentCache.meta = newPage.meta;
};

const mapMessageParticipant = (
  participant: ApiMessageParticipant,
  model: string,
): MessageParticipant => ({
  id: participant._id,
  name: participant.name ?? (model === 'Admin' ? 'Admin' : 'Student'),
  code: participant.adminId ?? participant.studentId,
  model,
  profilePicPath: participant.profilePicPath,
});

const mapMessage = (message: ApiMessage): ChatMessage => ({
  id: message._id,
  message: message.message ?? '',
  sendBy: mapMessageParticipant(message.sendBy, message.sendByModel),
  receivedTo: mapMessageParticipant(
    message.receivedTo,
    message.receivedToModel,
  ),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const mapMessageStudent = (student: ApiMessageStudent): MessageStudent => ({
  id: student._id,
  studentId: student.studentId,
  name: student.name ?? 'Student',
  level: student.level,
  profilePicPath: student.profilePicPath,
  unreadMessageCount: student.unreadMessageCount ?? 0,
});

const mapRankingStudent = (student: ApiRankingStudent): RankingStudent => ({
  id: student.studentId,
  rank: student.rank,
  name: student.name ?? 'Student',
  studentCode: student.studentCode,
  profilePicPath: student.profilePicPath,
  totalCorrect: student.totalCorrect ?? 0,
  totalQuestions: student.totalQuestions ?? 0,
  totalTimer: student.totalTimer ?? 0,
  completedCount: student.completedCount ?? 0,
  accuracy: student.accuracy ?? 0,
});

const getFileUploadsFromResponse = (
  response: ApiFileUploadsResponse,
): ApiFileUpload[] => {
  if (Array.isArray(response)) return response;

  return response.data ?? response.files ?? response.fileUploads ?? [];
};

const mapQuestionPaper = (file: ApiFileUpload): QuestionPaper => ({
  id: file._id ?? file.id ?? '',
  name: file.name ?? file.originalName ?? 'Question paper',
  path: file.path ?? file.filePath,
  url: file.url ?? file.fileUrl,
  originalName: file.originalName,
  mimeType: file.mimeType,
  size: file.fileSize ?? file.size,
  fileSize: file.fileSize,
  fileFormat: file.fileFormat,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const mapAchievement = (file: ApiFileUpload): Achievement => ({
  ...mapQuestionPaper(file),
  name: file.name ?? file.originalName ?? 'Celebration',
});

export const jjWingsApi = createApi({
  reducerPath: 'jjWingsApi',
  baseQuery,
  tagTypes: [
    'Student',
    'Students',
    'Admin',
    'Admins',
    'Question',
    'Questions',
    'Homework',
    'Score',
    'Notifications',
    'Messages',
    'Ranking',
    'FileUploads',
    'Teachers',
  ],
  endpoints: builder => ({
    getHomeworks: builder.query<HomeworksResult, HomeworkArg>({
      query: ({ studentId, state, type, page, limit }) => ({
        url: `/homework/${studentId}/${state}`,
        params: {
          page: page ?? 1,
          limit: limit ?? DEFAULT_HOMEWORK_LIMIT,
          ...(type ? { type } : {}),
        },
      }),
      transformResponse: (response: ApiHomeworksResponse) => ({
        homeworks: response.homeworks.map(mapHomework),
        meta: response.meta,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs?.studentId}-${queryArgs?.state}-${
          queryArgs?.type ?? 'ALL'
        }-${queryArgs?.limit ?? DEFAULT_HOMEWORK_LIMIT}`,
      merge: (currentCache, newPage) => {
        if (newPage.meta.page === 1) {
          currentCache.homeworks = newPage.homeworks;
          currentCache.meta = newPage.meta;
          return;
        }

        const existingIds = new Set(
          currentCache.homeworks.map(homework => homework.id),
        );
        const nextItems = newPage.homeworks.filter(
          homework => !existingIds.has(homework.id),
        );
        currentCache.homeworks.push(...nextItems);
        currentCache.meta = newPage.meta;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.state !== previousArg?.state ||
        currentArg?.type !== previousArg?.type ||
        currentArg?.limit !== previousArg?.limit,
      providesTags: (_result, _error, { studentId, state }) => [
        { type: 'Homework', id: `${studentId}_${state}` },
      ],
    }),

    getHomeworkById: builder.query<Homework | undefined, HomeworkByIdArg>({
      query: ({ homeworkId }) => `/homework/${homeworkId}`,
      transformResponse: (response: ApiHomeworkResponse) =>
        response.homework ? mapHomework(response.homework) : undefined,
      providesTags: (_result, _error, { homeworkId }) => [
        { type: 'Homework', id: homeworkId },
      ],
    }),
    getLogin: builder.query<LoginResult, LoginArg>({
      query: ({ username, password, deviceId }) => ({
        url: '/login',
        method: 'POST',
        body: {
          username,
          password,
          ...(deviceId ? { deviceId } : {}),
        },
      }),
      transformResponse: mapLogin,
    }),

    switchStudentLogin: builder.mutation<LoginResult, SwitchStudentLoginArg>({
      query: ({ studentId }) => ({
        url: `/login/${studentId}`,
        method: 'POST',
      }),
      transformResponse: mapLogin,
    }),

    getStudents: builder.query<StudentsResult, StudentsArg | void>({
      query: arg => ({
        url: '/admin/students',
        params: {
          page: arg?.page ?? 1,
          limit: arg?.limit ?? DEFAULT_STUDENTS_LIMIT,
          ...(typeof arg?.level === 'number' ? { level: arg.level } : {}),
        },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs?.level ?? 'ALL'}-${
          queryArgs?.limit ?? DEFAULT_STUDENTS_LIMIT
        }`,
      transformResponse: (response: ApiStudentsResponse) => ({
        students: response.students.map(mapStudent),
        meta: response.meta,
      }),
      merge: mergeStudentsResult,
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page,
      providesTags: result => [
        { type: 'Students', id: 'LIST' },
        ...(result?.students ?? []).map(student => ({
          type: 'Student' as const,
          id: student.id,
        })),
      ],
    }),

    getSameDeviceStudents: builder.query<SameDeviceStudent[], void>({
      query: () => '/student/same-device',
      transformResponse: (response: ApiSameDeviceStudentsResponse) =>
        response.students.map(mapSameDeviceStudent),
      providesTags: [{ type: 'Students', id: 'SAME_DEVICE' }],
    }),

    getTeachers: builder.query<AdminsResult, void>({
      query: () => '/admin/teacher',
      transformResponse: (response: ApiAdminsResponse) => ({
        admins: getTeachersFromResponse(response).map(mapTeacher),
        meta: Array.isArray(response) ? undefined : response.meta,
      }),
      providesTags: [{ type: 'Teachers', id: 'LIST' }],
    }),

    getQuestions: builder.query<QuestionsResult, QuestionsArg | void>({
      query: arg => ({
        url: '/admin/questions',
        params: {
          page: arg?.page ?? 1,
          limit: arg?.limit ?? DEFAULT_QUESTIONS_LIMIT,
          ...(typeof arg?.level === 'number' ? { level: arg.level } : {}),
          ...(arg?.type ? { type: arg.type } : {}),
          ...(arg?.search ? { search: arg.search } : {}),
        },
      }),
      transformResponse: (response: ApiQuestionsResponse) => ({
        questions: response.questions.map(mapQuestion),
        meta: response.meta,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs?.type ?? 'ALL'}-${
          queryArgs?.level ?? 'ALL'
        }-${queryArgs?.search ?? ''}-${
          queryArgs?.limit ?? DEFAULT_QUESTIONS_LIMIT
        }`,
      merge: (currentCache, newPage) => {
        if (newPage.meta.page === 1) {
          currentCache.questions = newPage.questions;
          currentCache.meta = newPage.meta;
          return;
        }

        const existingIds = new Set(
          currentCache.questions.map(question => question.id),
        );
        const nextItems = newPage.questions.filter(
          question => !existingIds.has(question.id),
        );
        currentCache.questions.push(...nextItems);
        currentCache.meta = newPage.meta;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.type !== previousArg?.type ||
        currentArg?.level !== previousArg?.level ||
        currentArg?.search !== previousArg?.search ||
        currentArg?.limit !== previousArg?.limit,
      providesTags: result => [
        { type: 'Questions', id: 'LIST' },
        ...((result?.questions ?? []).map(question => ({
          type: 'Question' as const,
          id: question.id,
        })) as Array<{ type: 'Question'; id: string }>),
      ],
    }),

    getAvailableQuestions: builder.query<
      QuestionsResult,
      AvailableQuestionsArg
    >({
      query: ({ studentId, level, type, page, limit }) => ({
        url: `/admin/questions/available/${studentId}`,
        params: {
          page: page ?? 1,
          limit: limit ?? DEFAULT_QUESTIONS_LIMIT,
          ...(typeof level === 'number' ? { level } : {}),
          ...(type ? { type } : {}),
        },
      }),
      transformResponse: (response: ApiQuestionsResponse) => ({
        questions: response.questions.map(mapQuestion),
        meta: response.meta,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs.studentId}-${queryArgs.type ?? 'ALL'}-${
          queryArgs.level ?? 'ALL'
        }-${queryArgs.limit ?? DEFAULT_QUESTIONS_LIMIT}`,
      merge: (currentCache, newPage) => {
        if (newPage.meta.page === 1) {
          currentCache.questions = newPage.questions;
          currentCache.meta = newPage.meta;
          return;
        }

        const existingIds = new Set(
          currentCache.questions.map(question => question.id),
        );
        const nextItems = newPage.questions.filter(
          question => !existingIds.has(question.id),
        );
        currentCache.questions.push(...nextItems);
        currentCache.meta = newPage.meta;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.type !== previousArg?.type ||
        currentArg?.level !== previousArg?.level ||
        currentArg?.limit !== previousArg?.limit,
      providesTags: (_result, _error, { studentId }) => [
        { type: 'Questions', id: `AVAILABLE_${studentId}` },
      ],
    }),

    getPracticeQuestions: builder.query<QuestionsResult, QuestionsArg | void>({
      query: arg => ({
        url: '/questions/practice',
        params: {
          page: arg?.page ?? 1,
          limit: DEFAULT_QUESTIONS_LIMIT,
          ...(typeof arg?.level === 'number' ? { level: arg.level } : {}),
          ...(arg?.search ? { search: arg.search } : {}),
        },
      }),
      transformResponse: (response: ApiQuestionsResponse) => ({
        questions: response.questions.map(mapQuestion),
        meta: response.meta,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs?.level ?? 'ALL'}-${
          queryArgs?.search ?? ''
        }-${DEFAULT_QUESTIONS_LIMIT}`,
      merge: (currentCache, newPage) => {
        if (newPage.meta.page === 1) {
          currentCache.questions = newPage.questions;
          currentCache.meta = newPage.meta;
          return;
        }

        const existingIds = new Set(
          currentCache.questions.map(question => question.id),
        );
        const nextItems = newPage.questions.filter(
          question => !existingIds.has(question.id),
        );
        currentCache.questions.push(...nextItems);
        currentCache.meta = newPage.meta;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.level !== previousArg?.level ||
        currentArg?.search !== previousArg?.search ||
        currentArg?.limit !== previousArg?.limit,
      providesTags: result => [
        { type: 'Questions', id: 'PRACTICE_LIST' },
        ...((result?.questions ?? []).map(question => ({
          type: 'Question' as const,
          id: question.id,
        })) as Array<{ type: 'Question'; id: string }>),
      ],
    }),
    getScore: builder.query<Score, ScoreArg>({
      query: ({ studentId }) => `/scores/${studentId}`,
      transformResponse: (response: ApiScore, _meta, { studentId }) => ({
        studentId,
        assigned: response.assigned ?? 0,
        new: response.new ?? 0,
        progress: response.progress ?? 0,
        success: response.correct ?? 0,
        failure: response.wrong ?? 0,
        timeTaken: response.timeTaken ?? 0,
        completed: response.completed ?? 0,
        practiceAssigned: response.practiceAssigned ?? 0,
        practiceNew: response.practiceNew ?? 0,
        practiceProgress: response.practiceProgress ?? 0,
        practiceCompleted: response.practiceCompleted ?? 0,
        practiceSuccess: response.practiceCorrect ?? 0,
        practiceFailure: response.practiceWrong ?? 0,
        practiceTimeTaken: response.practiceTimeTaken ?? 0,
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: 'Score', id: studentId },
      ],
    }),

    getNotifications: builder.query<NotificationsResult, NotificationsArg>({
      query: ({ studentId, page = 1, limit = DEFAULT_NOTIFICATION_LIMIT }) => ({
        url: `/notifications/${studentId}`,
        params: { page, limit },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs.studentId}-${
          queryArgs.limit ?? DEFAULT_NOTIFICATION_LIMIT
        }`,
      transformResponse: (response: ApiNotificationsResponse) => ({
        notifications: response.data.map(mapNotification),
        meta: response.meta,
      }),
      merge: mergeNotificationsResult,
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page,
      providesTags: (_result, _error, { studentId }) => [
        { type: 'Notifications', id: studentId },
      ],
    }),

    getAdminNotifications: builder.query<
      NotificationsResult,
      AdminNotificationsArg | void
    >({
      query: arg => ({
        url: '/admin/notifications',
        params: {
          page: arg?.page ?? 1,
          limit: arg?.limit ?? DEFAULT_NOTIFICATION_LIMIT,
        },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs?.limit ?? DEFAULT_NOTIFICATION_LIMIT}`,
      transformResponse: (response: ApiNotificationsResponse) => ({
        notifications: response.data.map(mapNotification),
        meta: response.meta,
      }),
      merge: mergeNotificationsResult,
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page,
      providesTags: [{ type: 'Notifications', id: 'ADMIN' }],
    }),

    getMessages: builder.query<ChatMessage[], void>({
      query: () => ({
        url: '/messages',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiMessagesResponse) =>
        response.data.map(mapMessage),
      providesTags: [{ type: 'Messages', id: 'LIST' }],
    }),

    getMessageStudents: builder.query<MessageStudent[], void>({
      query: () => ({
        url: '/admin/messages/students',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiMessageStudentsResponse) =>
        response.students.map(mapMessageStudent),
      providesTags: [{ type: 'Messages', id: 'STUDENTS' }],
    }),

    getUnreadMessageCount: builder.query<number, void>({
      query: () => '/messages/unread-count',
      transformResponse: (response: ApiUnreadMessageCountResponse) =>
        response.data?.unreadCount ?? response.unreadCount ?? 0,
      providesTags: [{ type: 'Messages', id: 'UNREAD_COUNT' }],
    }),

    getRanking: builder.query<RankingStudent[], RankingArg | void>({
      query: arg => ({
        url: '/ranking',
        params: typeof arg?.level === 'number' ? { level: arg.level } : {},
      }),
      transformResponse: (response: ApiRankingResponse) =>
        response.data.map(mapRankingStudent),
      providesTags: [{ type: 'Ranking', id: 'LIST' }],
    }),

    getQuestionPapers: builder.query<QuestionPaper[], void>({
      query: () => ({
        url: '/file-uploads',
        params: { type: 'practice' },
      }),
      transformResponse: (response: ApiFileUploadsResponse) =>
        getFileUploadsFromResponse(response)
          .map(mapQuestionPaper)
          .filter(file => file.id.length > 0),
      providesTags: [{ type: 'FileUploads', id: 'PRACTICE' }],
    }),

    getAchievements: builder.query<Achievement[], void>({
      query: () => ({
        url: '/file-uploads',
        params: { type: 'celebration' },
      }),
      transformResponse: (response: ApiFileUploadsResponse) =>
        getFileUploadsFromResponse(response)
          .map(mapAchievement)
          .filter(file => file.id.length > 0),
      providesTags: [{ type: 'FileUploads', id: 'CELEBRATION' }],
    }),

    sendNotification: builder.mutation<string, SendNotificationArg>({
      query: body => ({
        url: '/admin/notifications',
        method: 'POST',
        body,
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentIds }) => [
        ...studentIds.map(student => ({
          type: 'Notifications' as const,
          id: student.id,
        })),
        { type: 'Notifications' as const, id: 'ADMIN' },
      ],
    }),

    addStudent: builder.mutation<addStudentResponse, AddStudentArg>({
      query: ({ name, level }) => ({
        url: '/admin/students',
        method: 'POST',
        body: { name, level },
      }),
      transformResponse: (response: addStudentResponse) => response,
      invalidatesTags: [{ type: 'Students', id: 'LIST' }],
    }),

    updateStudent: builder.mutation<string, UpdateStudentArg>({
      query: ({ studentId, name, level, isDeleted, horizontal }) => ({
        url: `/admin/students/${studentId}`,
        method: 'PATCH',
        body: {
          ...(name !== undefined && { name }),
          ...(level !== undefined && { level }),
          ...(isDeleted !== undefined && { isDeleted }),
          ...(horizontal !== undefined && { vertical: !horizontal }),
        },
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: 'Student', id: studentId },
        { type: 'Students', id: 'LIST' },
      ],
    }),
    addTeacher: builder.mutation<addAdminResponse, AddTeacherArg>({
      query: ({ name }) => ({
        url: '/admin/teacher',
        method: 'POST',
        body: { name },
      }),
      transformResponse: (response: addAdminResponse) => response,
      invalidatesTags: [{ type: 'Teachers', id: 'LIST' }],
    }),

    updateTeacher: builder.mutation<string, UpdateTeacherArg>({
      query: ({ teacherId, name, isDeleted }) => ({
        url: `/admin/teacher/${teacherId}`,
        method: 'PATCH',
        body: {
          ...(typeof name === 'string' ? { name } : {}),
          ...(typeof isDeleted === 'boolean' ? { isDeleted } : {}),
        },
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'Teachers', id: 'LIST' }],
    }),

    updateStudentFcmToken: builder.mutation<string, UpdateStudentFcmTokenArg>({
      query: ({ fcmToken }) => ({
        url: '/student/fcm-token',
        method: 'PATCH',
        body: { fcmToken },
      }),
      transformResponse: () => 'success',
    }),

    updateStudentPassword: builder.mutation<string, UpdatePasswordArg>({
      query: ({ oldPassword, newPassword, confirmNewPassword }) => ({
        url: '/change-password',
        method: 'PATCH',
        body: {
          oldPassword,
          newPassword,
          confirmNewPassword,
        },
      }),
      transformResponse: () => 'success',
    }),

    updateAdminPassword: builder.mutation<string, UpdatePasswordArg>({
      query: ({ oldPassword, newPassword, confirmNewPassword }) => ({
        url: '/change-password',
        method: 'PATCH',
        body: {
          oldPassword,
          newPassword,
          confirmNewPassword,
        },
      }),
      transformResponse: () => 'success',
    }),

    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordArg>({
      query: ({ studentId }) => ({
        url: `/admin/students/${studentId}/reset-password`,
        method: 'POST',
      }),
      transformResponse: (response: ResetPasswordResponse) => response,
    }),

    updateStudentDeviceId: builder.mutation<string, UpdateStudentDeviceIdArg>({
      query: ({ deviceId, authToken }) => ({
        url: '/student',
        method: 'PATCH',
        body: { deviceId },
        headers: authToken ? { 'x-access-token': authToken } : undefined,
      }),
      transformResponse: () => 'success',
    }),

    deleteStudentDeviceId: builder.mutation<string, DeleteStudentDeviceIdArg>({
      query: ({ studentId, deviceId }) => ({
        url: '/student/device-id',
        method: 'DELETE',
        body: { studentId, deviceId },
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'Students', id: 'SAME_DEVICE' }],
    }),

    removeStudentFcmToken: builder.mutation<string, RemoveStudentFcmTokenArg>({
      query: ({ studentId, fcmToken }) => ({
        url: `/admin/students/${studentId}`,
        method: 'PATCH',
        body: { removeFcmToken: fcmToken },
      }),
      transformResponse: () => 'success',
    }),

    uploadProfilePic: builder.mutation<string | undefined, UploadProfilePicArg>(
      {
        query: ({ file }) => {
          const formData = new FormData();
          formData.append('path', 'profile');
          formData.append('file', {
            uri: file.uri,
            type: file.type ?? 'image/jpeg',
            name: file.name ?? 'profile.jpg',
          } as any);

          return {
            url: '/uploads',
            method: 'POST',
            body: formData,
          };
        },
        transformResponse: (response: UploadResponse) =>
          response.profilePicPath ??
          response.file?.path ??
          response.url ??
          response.file?.url ??
          response.fileUrl ??
          response.location ??
          response.path ??
          response.data?.profilePicPath ??
          response.data?.url ??
          response.data?.fileUrl ??
          response.data?.location ??
          response.data?.path,
      },
    ),

    deleteProfilePic: builder.mutation<string, void>({
      query: () => ({
        url: '/profile-pic',
        method: 'DELETE',
      }),
      transformResponse: () => 'success',
    }),

    uploadQuestionPaper: builder.mutation<string, UploadQuestionPaperArg>({
      query: ({ file, name }) => {
        const formData = new FormData();
        formData.append('path', 'practice');
        formData.append('name', name);
        formData.append('file', {
          uri: file.uri,
          type: file.type ?? 'application/octet-stream',
          name: file.name ?? name,
        } as any);

        return {
          url: '/uploads',
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'FileUploads', id: 'PRACTICE' }],
    }),

    uploadAchievement: builder.mutation<string, UploadAchievementArg>({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('path', 'celebration');
        formData.append('name', 'celebration');
        formData.append('file', {
          uri: file.uri,
          type: file.type ?? 'image/jpeg',
          name: file.name ?? 'celebration.jpg',
        } as any);

        return {
          url: '/uploads',
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'FileUploads', id: 'CELEBRATION' }],
    }),

    deleteQuestionPaper: builder.mutation<string, string>({
      query: id => ({
        url: `/admin/file-uploads/${id}`,
        method: 'DELETE',
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'FileUploads', id: 'PRACTICE' }],
    }),

    deleteAchievement: builder.mutation<string, string>({
      query: id => ({
        url: `/admin/file-uploads/${id}`,
        method: 'DELETE',
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'FileUploads', id: 'CELEBRATION' }],
    }),

    getQuestionPaperDownload: builder.query<string, string>({
      query: id => ({
        url: `/file-uploads/${id}/download`,
        responseHandler: async response => {
          const fallbackUrl = `${API_URL}/file-uploads/${id}/download`;
          const contentType = response.headers.get('content-type') ?? '';

          if (contentType.includes('application/json')) {
            const json = (await response.json()) as DownloadResponse;

            if (typeof json === 'string') return json;

            return (
              json.downloadUrl ??
              json.url ??
              json.file?.url ??
              json.file?.path ??
              json.data?.downloadUrl ??
              json.data?.url ??
              json.data?.path ??
              json.path ??
              fallbackUrl
            );
          }

          return fallbackUrl;
        },
      }),
    }),

    createQuestion: builder.mutation<string, CreateQuestionArg>({
      query: ({ taskId, question, level, type, marks, oral }) => ({
        url: '/admin/questions',
        method: 'POST',
        body: {
          questionId: taskId,
          questions: question,
          level,
          type,
          ...(marks ? { marks } : {}),
          ...(oral ? { oral } : {}),
        },
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'Questions', id: 'LIST' }],
    }),

    deleteQuestion: builder.mutation<string, DeleteQuestionArg>({
      query: ({ questionId }) => ({
        url: `/admin/questions/${questionId}`,
        method: 'DELETE',
      }),
      transformResponse: () => 'success',
    }),

    updateQuestion: builder.mutation<string, UpdateQuestionArg>({
      query: ({ id, questionId, level }) => ({
        url: `/admin/questions/${id}`,
        method: 'PATCH',
        body: { questionId, level },
      }),
      transformResponse: () => 'success',
    }),

    assignHomework: builder.mutation<AssignHomeworkResult, AssignHomeworkArg>({
      query: ({ studentId, levels, questionIds }) => ({
        url: '/admin/questions/assign',
        method: 'POST',
        body: {
          questionIds,
          ...(studentId ? { studentId } : {}),
          ...(levels ? { levels } : {}),
        },
      }),
      invalidatesTags: (_result, _error, { studentId }) => [
        ...(studentId
          ? [
              {
                type: 'Homework' as const,
                id: `${studentId}_${HomeworkState.NEW}`,
              },
              { type: 'Score' as const, id: studentId },
              { type: 'Questions' as const, id: `AVAILABLE_${studentId}` },
            ]
          : []),
        { type: 'Students', id: 'LIST' },
      ],
    }),

    sendMessage: builder.mutation<string, SendMessageArg>({
      query: body => ({
        url: '/messages',
        method: 'POST',
        body,
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'Messages', id: 'LIST' }],
    }),

    generateOtp: builder.mutation<GeneralResponse, GenerateOtpReq>({
      query: ({ email }) => ({
        url: '/send-otp',
        method: 'POST',
        body: { email },
      }),
    }),

    verifyOtp: builder.mutation<GeneralResponse, VerifyOtpReq>({
      query: ({ email, otp }) => ({
        url: '/verify-otp',
        method: 'POST',
        body: { email, otp },
      }),
    }),

    verifyPrefix: builder.mutation<VerifyPrefixRes, VerifyPrefixReq>({
      query: body => ({
        url: 'verify-prefix',
        method: 'POST',
        body,
      }),
    }),

    createOrg: builder.mutation<GeneralResponse, CreateOrgReq>({
      query: body => ({
        url: '/org',
        method: 'POST',
        body,
      }),
    }),

    readMessages: builder.mutation<string, ReadMessagesArg>({
      query: body => ({
        url: '/messages/read',
        method: 'PATCH',
        body,
      }),
      transformResponse: () => 'success',
      invalidatesTags: [
        { type: 'Messages', id: 'LIST' },
        { type: 'Messages', id: 'STUDENTS' },
      ],
      async onQueryStarted({ studentId }, { dispatch, queryFulfilled }) {
        let readCount = 0;
        const patchResult = dispatch(
          jjWingsApi.util.updateQueryData(
            'getMessageStudents',
            undefined,
            students => {
              const student = students.find(item => item.id === studentId);
              if (student) {
                readCount = student.unreadMessageCount;
                student.unreadMessageCount = 0;
              }
            },
          ),
        );

        try {
          await queryFulfilled;
          dispatch(reduceMessageUnreadCount(readCount));
          const unreadCount = await dispatch(
            jjWingsApi.endpoints.getUnreadMessageCount.initiate(undefined, {
              forceRefetch: true,
              subscribe: false,
            }),
          ).unwrap();
          dispatch(setMessageUnreadCount(unreadCount));
        } catch {
          patchResult.undo();
        }
      },
    }),

    unassignHomework: builder.mutation<string, UnassignHomeworkArg>({
      query: ({ studentId, questionIds }) => ({
        url: '/admin/questions/assign',
        method: 'DELETE',
        body: { studentId, questionIds },
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: 'Homework', id: `${studentId}_${HomeworkState.NEW}` },
        { type: 'Score', id: studentId },
        { type: 'Questions', id: `AVAILABLE_${studentId}` },
        { type: 'Students', id: 'LIST' },
      ],
    }),

    assignPracticeQuestions: builder.mutation<
      string,
      AssignPracticeQuestionsArg
    >({
      query: ({ questionIds }) => ({
        url: '/student/questions/practice/assign',
        method: 'POST',
        body: { questionIds },
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: 'Questions', id: 'PRACTICE_LIST' },
        ...(studentId
          ? [
              {
                type: 'Homework' as const,
                id: `${studentId}_${HomeworkState.NEW}`,
              },
              { type: 'Score' as const, id: studentId },
            ]
          : []),
      ],
    }),

    unassignPracticeQuestions: builder.mutation<
      string,
      UnassignPracticeQuestionsArg
    >({
      query: ({ questionIds }) => ({
        url: '/student/questions/practice/assign',
        method: 'DELETE',
        body: { questionIds },
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: 'Questions', id: 'PRACTICE_LIST' },
        ...(studentId
          ? [
              {
                type: 'Homework' as const,
                id: `${studentId}_${HomeworkState.NEW}`,
              },
              { type: 'Score' as const, id: studentId },
              { type: 'Students' as const, id: 'LIST' },
            ]
          : []),
      ],
    }),

    updateHomework: builder.mutation<string, UpdateHomeworkArg>({
      query: ({ homeworkId, state, result, answer, timer }) => ({
        url: `/homework/${homeworkId}`,
        method: 'PATCH',
        body: {
          state,
          timer,
          answers: answer.map(String),
          results: result,
        },
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { homeworkId }) => [
        { type: 'Homework', id: homeworkId },
        'Homework',
        'Score',
        { type: 'Students', id: 'LIST' },
        { type: 'Ranking', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHomeworksQuery,
  useLazyGetLoginQuery,
  useSwitchStudentLoginMutation,
  useUpdateHomeworkMutation,
  useGetHomeworkByIdQuery,
  useGetStudentsQuery,
  useGetSameDeviceStudentsQuery,
  useGetTeachersQuery,
  useGetQuestionsQuery,
  useGetPracticeQuestionsQuery,
  useGetAvailableQuestionsQuery,
  useAddStudentMutation,
  useUpdateStudentMutation,
  useAddTeacherMutation,
  useUpdateTeacherMutation,
  useUpdateStudentFcmTokenMutation,
  useUpdateStudentPasswordMutation,
  useUpdateAdminPasswordMutation,
  useResetPasswordMutation,
  useUpdateStudentDeviceIdMutation,
  useDeleteStudentDeviceIdMutation,
  useRemoveStudentFcmTokenMutation,
  useUploadProfilePicMutation,
  useDeleteProfilePicMutation,
  useCreateQuestionMutation,
  useDeleteQuestionMutation,
  useUpdateQuestionMutation,
  useAssignHomeworkMutation,
  useUnassignHomeworkMutation,
  useAssignPracticeQuestionsMutation,
  useUnassignPracticeQuestionsMutation,
  useGetScoreQuery,
  useGetNotificationsQuery,
  useGetAdminNotificationsQuery,
  useGetMessagesQuery,
  useGetMessageStudentsQuery,
  useLazyGetUnreadMessageCountQuery,
  useGetRankingQuery,
  useReadMessagesMutation,
  useSendNotificationMutation,
  useSendMessageMutation,
  useGetQuestionPapersQuery,
  useUploadQuestionPaperMutation,
  useDeleteQuestionPaperMutation,
  useLazyGetQuestionPaperDownloadQuery,
  useGetAchievementsQuery,
  useUploadAchievementMutation,
  useDeleteAchievementMutation,
  useGenerateOtpMutation,
  useVerifyOtpMutation,
  useVerifyPrefixMutation,
  useCreateOrgMutation,
} = jjWingsApi;
