// src/store/api.ts
import { createApi } from '@reduxjs/toolkit/query/react';

import { HomeworkState } from '../util/enum';
import { baseQuery } from './baseQuery';

const DEFAULT_LIMIT = 500;

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
};

type ApiStudent = {
  _id: string;
  studentId?: string;
  name?: string;
  vertical?: boolean;
  deviceIds?: string[];
  fcmToken?: string;
  fcmTokens?: string[];
  score?: ApiScore;
};

type ApiQuestion = {
  _id: string;
  questionId?: string;
  questions?: string[];
};

type ApiHomework = {
  _id: string;
  studentId: string;
  questionId: ApiQuestion | string;
  state?: 'PROGRESS' | 'NEW' | 'COMPLETED';
  results?: boolean[];
  answers?: Array<number | string>;
  timer?: number;
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
};

type ApiRankingResponse = {
  data: ApiRankingStudent[];
};

export type Student = {
  id: string;
  name: string;
  studentId?: string;
  fcmTokens: string[];
  horizontal: boolean;
  assigned: number;
  completed: number;
  new: number;
  success: number;
  failure: number;
};

export type SameDeviceStudent = {
  id: string;
  name: string;
  studentId?: string;
  deviceIds: string[];
  horizontal: boolean;
};

export type Question = {
  question?: string[];
};

export type QuestionTask = {
  id: string;
  questionId?: string;
  question: string[];
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
};

export type RankingStudent = {
  id: string;
  rank: number;
  name: string;
  studentCode?: string;
  totalCorrect: number;
  totalQuestions: number;
  totalTimer: number;
  completedCount: number;
  accuracy: number;
};

type LoginArg = {
  username: string;
  password: string;
};

type SwitchStudentLoginArg = {
  studentId: string;
};

type LoginApiResponse = {
  success: boolean;
  message: string;
  token: string;
  role: 'student' | 'admin';
  user: {
    id: string;
    name: string;
    studentId?: string;
    adminId?: string;
    vertical: boolean;
  };
};

type LoginResult = {
  id: string;
  name: string;
  role: 'student' | 'admin';
  token: string;
  vertical: boolean;
};

type HomeworkArg = {
  studentId: string;
  state: 'PROGRESS' | 'NEW' | 'COMPLETED';
};

type HomeworkByIdArg = {
  homeworkId: string;
};

type ScoreArg = {
  studentId: string;
};

type StudentByIdArg = {
  studentId: string;
};

type AddStudentArg = {
  name: string;
};

type UpdateStudentHorizontalArg = {
  studentId: string;
  horizontal: boolean;
};

type UpdateStudentFcmTokenArg = {
  fcmToken: string;
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
};

type AssignHomeworkArg = {
  studentId: string;
  questionIds: string[];
};

type AvailableQuestionsArg = {
  studentId: string;
};

type NotificationsArg = {
  studentId: string;
};

type SendNotificationArg = {
  studentIds: Array<{
    id: string;
  }>;
  messageHeader: string;
  messageBody: string;
};

const mapStudent = (student: ApiStudent): Student => ({
  id: student._id,
  name: student.name ?? '',
  studentId: student.studentId,
  fcmTokens: [
    ...(student.fcmTokens ?? []),
    ...(student.fcmToken ? [student.fcmToken] : []),
  ],
  horizontal: !(student.vertical ?? true),
  assigned: student.score?.assigned ?? 0,
  completed: student.score?.completed ?? 0,
  new: student.score?.new ?? 0,
  success: student.score?.correct ?? 0,
  failure: student.score?.wrong ?? 0,
});

const mapSameDeviceStudent = (student: ApiStudent): SameDeviceStudent => ({
  id: student._id,
  name: student.name ?? '',
  studentId: student.studentId,
  deviceIds: student.deviceIds ?? [],
  horizontal: !(student.vertical ?? true),
});

const mapQuestion = (question: ApiQuestion): QuestionTask => ({
  id: question._id,
  questionId: question.questionId,
  question: question.questions ?? [],
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
    },
    state: homework.state ?? HomeworkState.NEW,
    result: homework.results ?? [],
    answer: (homework.answers ?? []).map(Number),
    timer: homework.timer ?? 0,
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

const mapRankingStudent = (student: ApiRankingStudent): RankingStudent => ({
  id: student.studentId,
  rank: student.rank,
  name: student.name ?? 'Student',
  studentCode: student.studentCode,
  totalCorrect: student.totalCorrect ?? 0,
  totalQuestions: student.totalQuestions ?? 0,
  totalTimer: student.totalTimer ?? 0,
  completedCount: student.completedCount ?? 0,
  accuracy: student.accuracy ?? 0,
});

const getNextStudentId = (students: Student[]): IdGenData => {
  const lastId = students.reduce((highest, student) => {
    const numericId = Number(student.studentId?.replace(/\D/g, '') ?? 0);
    return Math.max(highest, numericId);
  }, 100);

  return { studentLastID: lastId + 1 };
};

export const jjWingsApi = createApi({
  reducerPath: 'jjWingsApi',
  baseQuery,
  tagTypes: [
    'Student',
    'Students',
    'Question',
    'Questions',
    'Homework',
    'Score',
    'Notifications',
    'Ranking',
  ],
  endpoints: builder => ({
    getHomeworks: builder.query<Homework[], HomeworkArg>({
      query: ({ studentId, state }) => ({
        url: `/homework/${studentId}/${state}`,
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiHomeworksResponse) =>
        response.homeworks.map(mapHomework),
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

    getStudentById: builder.query<Student | undefined, StudentByIdArg>({
      query: () => ({
        url: '/admin/students',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (
        response: ApiStudentsResponse,
        _meta,
        { studentId },
      ) =>
        response.students
          .map(mapStudent)
          .find(student => student.id === studentId),
      providesTags: (_result, _error, { studentId }) => [
        { type: 'Student', id: studentId },
      ],
    }),

    getLogin: builder.query<LoginResult, LoginArg>({
      query: ({ username, password }) => ({
        url: '/login',
        method: 'POST',
        body: {
          username,
          password,
        },
      }),
      transformResponse: (response: LoginApiResponse) => ({
        id: response.user.id,
        name: response.user.name,
        role: response.role,
        token: response.token,
        vertical: response.user.vertical,
      }),
    }),

    switchStudentLogin: builder.mutation<LoginResult, SwitchStudentLoginArg>({
      query: ({ studentId }) => ({
        url: `/login/${studentId}`,
        method: 'POST',
      }),
      transformResponse: (response: LoginApiResponse) => ({
        id: response.user.id,
        name: response.user.name,
        role: response.role,
        token: response.token,
        vertical: response.user.vertical,
      }),
    }),

    getStudents: builder.query<Student[], void>({
      query: () => ({
        url: '/admin/students',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiStudentsResponse) =>
        response.students.map(mapStudent),
      providesTags: result => [
        { type: 'Students', id: 'LIST' },
        ...(result ?? []).map(student => ({
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

    getQuestions: builder.query<QuestionTask[], void>({
      query: () => ({
        url: '/admin/questions',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiQuestionsResponse) =>
        response.questions.map(mapQuestion),
      providesTags: result => [
        { type: 'Questions', id: 'LIST' },
        ...(result ?? []).map(question => ({
          type: 'Question' as const,
          id: question.id,
        })),
      ],
    }),

    getAvailableQuestions: builder.query<QuestionTask[], AvailableQuestionsArg>(
      {
        query: ({ studentId }) => ({
          url: `/admin/questions/available/${studentId}`,
          params: { page: 1, limit: DEFAULT_LIMIT },
        }),
        transformResponse: (response: ApiQuestionsResponse) =>
          response.questions.map(mapQuestion),
        providesTags: (_result, _error, { studentId }) => [
          { type: 'Questions', id: `AVAILABLE_${studentId}` },
        ],
      },
    ),

    getIdGen: builder.query<IdGenData, void>({
      query: () => ({
        url: '/admin/students',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiStudentsResponse) =>
        getNextStudentId(response.students.map(mapStudent)),
      providesTags: [{ type: 'Students', id: 'LIST' }],
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
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: 'Score', id: studentId },
      ],
    }),

    getNotifications: builder.query<Notification[], NotificationsArg>({
      query: ({ studentId }) => ({
        url: `/notifications/${studentId}`,
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiNotificationsResponse) =>
        response.data.map(mapNotification),
      providesTags: (_result, _error, { studentId }) => [
        { type: 'Notifications', id: studentId },
      ],
    }),

    getAdminNotifications: builder.query<Notification[], void>({
      query: () => ({
        url: '/admin/notifications',
        params: { page: 1, limit: DEFAULT_LIMIT },
      }),
      transformResponse: (response: ApiNotificationsResponse) =>
        response.data.map(mapNotification),
      providesTags: [{ type: 'Notifications', id: 'ADMIN' }],
    }),

    getRanking: builder.query<RankingStudent[], void>({
      query: () => '/ranking',
      transformResponse: (response: ApiRankingResponse) =>
        response.data.map(mapRankingStudent),
      providesTags: [{ type: 'Ranking', id: 'LIST' }],
    }),

    sendNotification: builder.mutation<string, SendNotificationArg>({
      query: body => ({
        url: '/admin/notifications',
        method: 'POST',
        body,
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentIds }) =>
        [
          ...studentIds.map(student => ({
            type: 'Notifications' as const,
            id: student.id,
          })),
          { type: 'Notifications' as const, id: 'ADMIN' },
        ],
    }),

    addStudent: builder.mutation<string, AddStudentArg>({
      query: ({ name }) => ({
        url: '/admin/students',
        method: 'POST',
        body: { name },
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'Students', id: 'LIST' }],
    }),

    updateStudentHorizontal: builder.mutation<
      string,
      UpdateStudentHorizontalArg
    >({
      query: ({ studentId, horizontal }) => ({
        url: `/admin/students/${studentId}`,
        method: 'PATCH',
        body: { vertical: !horizontal },
      }),
      transformResponse: () => 'success',
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: 'Student', id: studentId },
        { type: 'Students', id: 'LIST' },
      ],
    }),

    updateStudentFcmToken: builder.mutation<string, UpdateStudentFcmTokenArg>({
      query: ({ fcmToken }) => ({
        url: '/student/fcm-token',
        method: 'PATCH',
        body: { fcmToken },
      }),
      transformResponse: () => 'success',
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

    createQuestion: builder.mutation<string, CreateQuestionArg>({
      query: ({ taskId, question }) => ({
        url: '/admin/questions',
        method: 'POST',
        body: {
          questionId: taskId,
          questions: question,
        },
      }),
      transformResponse: () => 'success',
      invalidatesTags: [{ type: 'Questions', id: 'LIST' }],
    }),

    assignHomework: builder.mutation<string, AssignHomeworkArg>({
      query: ({ studentId, questionIds }) => ({
        url: '/admin/questions/assign',
        method: 'POST',
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
  useGetStudentByIdQuery,
  useGetStudentsQuery,
  useGetSameDeviceStudentsQuery,
  useGetQuestionsQuery,
  useGetAvailableQuestionsQuery,
  useAddStudentMutation,
  useUpdateStudentHorizontalMutation,
  useUpdateStudentFcmTokenMutation,
  useUpdateStudentDeviceIdMutation,
  useDeleteStudentDeviceIdMutation,
  useRemoveStudentFcmTokenMutation,
  useCreateQuestionMutation,
  useAssignHomeworkMutation,
  useGetIdGenQuery,
  useGetScoreQuery,
  useGetNotificationsQuery,
  useGetAdminNotificationsQuery,
  useGetRankingQuery,
  useSendNotificationMutation,
} = jjWingsApi;
