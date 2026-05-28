// src/store/api.ts
import { createApi } from '@reduxjs/toolkit/query/react';

import { HomeworkState } from '../util/enum';
import { baseQuery } from './baseQuery';

const DEFAULT_LIMIT = 15;

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
};

type ApiStudentsResponse = {
  students: ApiStudent[];
  meta: ApiMeta;
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

export type Student = {
  id: string;
  name: string;
  studentId?: string;
  horizontal: boolean;
  assigned: number;
  completed: number;
  new: number;
  success: number;
  failure: number;
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

type LoginArg = {
  username: string;
  password: string;
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
  };
};

type LoginResult = {
  id: string;
  name: string;
  role: 'student' | 'admin';
  token: string;
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
  studentId: string;
  name: string;
  password: string;
  studentLastID: number;
};

type UpdateStudentHorizontalArg = {
  studentId: string;
  horizontal: boolean;
};

type UpdateStudentFcmTokenArg = {
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
  questionId: string;
};

type AvailableQuestionsArg = {
  studentId: string;
};

const mapStudent = (student: ApiStudent): Student => ({
  id: student._id,
  name: student.name ?? '',
  studentId: student.studentId,
  horizontal: !(student.vertical ?? true),
  assigned: student.score?.assigned ?? 0,
  completed: student.score?.completed ?? 0,
  new: student.score?.new ?? 0,
  success: student.score?.correct ?? 0,
  failure: student.score?.wrong ?? 0,
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
  };
};

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
      query: ({ studentId, fcmToken }) => ({
        url: `/admin/students/${studentId}`,
        method: 'PATCH',
        body: { fcmToken },
      }),
      transformResponse: () => 'success',
    }),

    removeStudentFcmToken: builder.mutation<string, UpdateStudentFcmTokenArg>({
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
      query: ({ studentId, questionId }) => ({
        url: '/admin/questions/assign',
        method: 'POST',
        body: { studentId, questionId },
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
      ],
    }),
  }),
});

export const {
  useGetHomeworksQuery,
  useLazyGetLoginQuery,
  useUpdateHomeworkMutation,
  useGetHomeworkByIdQuery,
  useGetStudentByIdQuery,
  useGetStudentsQuery,
  useGetQuestionsQuery,
  useGetAvailableQuestionsQuery,
  useAddStudentMutation,
  useUpdateStudentHorizontalMutation,
  useUpdateStudentFcmTokenMutation,
  useRemoveStudentFcmTokenMutation,
  useCreateQuestionMutation,
  useAssignHomeworkMutation,
  useGetIdGenQuery,
  useGetScoreQuery,
} = jjWingsApi;
