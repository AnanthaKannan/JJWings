// src/store/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  login,
  getHomeworks,
  updateHomework,
  getHomeworkById,
  listStudents,
  listQuestions,
  addStudent,
  createQuestion,
  assignHomework,
  getIdGenData,
  getScore,
  type Homework,
  type IdGenData,
  type QuestionTask,
  type Score,
  type Student,
} from './query';

type LoginArg = {
  studentId: string;
  password: string;
};

type LoginResult = {
  id: string;
  name: string;
};

type HomeworkArg = {
  studentId: string;
};

type HomeworkByIdArg = {
  homeworkId: string;
};

type AddStudentArg = {
  studentId: string;
  name: string;
  password: string;
  studentLastID: number;
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

export const firestoreApi = createApi({
  reducerPath: 'firestoreApi',
  baseQuery: fakeBaseQuery(), // ← key for non-HTTP apis
  endpoints: builder => ({
    // GET questions
    getHomeworks: builder.query<Homework[], HomeworkArg>({
      queryFn: async ({ studentId }) => {
        try {
          const data = await getHomeworks(studentId);
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    getHomeworkById: builder.query<Homework | undefined, HomeworkByIdArg>({
      queryFn: async ({ homeworkId }) => {
        try {
          const data = await getHomeworkById(homeworkId);
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    getLogin: builder.query<LoginResult, LoginArg>({
      queryFn: async ({ studentId, password }) => {
        try {
          const data = await login(studentId, password);
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    getStudents: builder.query<Student[], void>({
      queryFn: async () => {
        try {
          const data = await listStudents();
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    getQuestions: builder.query<QuestionTask[], void>({
      queryFn: async () => {
        try {
          const data = await listQuestions();
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    getIdGen: builder.query<IdGenData, void>({
      queryFn: async () => {
        try {
          const data = await getIdGenData();
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    getScore: builder.query<Score, HomeworkArg>({
      queryFn: async ({ studentId }) => {
        try {
          const data = await getScore(studentId);
          return { data };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    addStudent: builder.mutation<string, AddStudentArg>({
      queryFn: async ({ studentId, name, password, studentLastID }) => {
        try {
          await addStudent(studentId, name, password, studentLastID);
          return { data: 'success' };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    createQuestion: builder.mutation<string, CreateQuestionArg>({
      queryFn: async ({ taskId, question }) => {
        try {
          await createQuestion(taskId, question);
          return { data: 'success' };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    assignHomework: builder.mutation<string, AssignHomeworkArg>({
      queryFn: async ({ studentId, questionIds }) => {
        try {
          await assignHomework(studentId, questionIds);
          return { data: 'success' };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    updateHomework: builder.mutation<string, UpdateHomeworkArg>({
      queryFn: async ({
        homeworkId,
        state,
        result,
        answer,
        timer,
        success,
        failure,
      }) => {
        try {
          await updateHomework(
            homeworkId,
            state,
            result,
            answer,
            timer,
            success,
            failure,
          );
          return { data: 'success' };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),
  }),
});

export const {
  useGetHomeworksQuery,
  useLazyGetLoginQuery,
  useUpdateHomeworkMutation,
  useGetHomeworkByIdQuery,
  useGetStudentsQuery,
  useGetQuestionsQuery,
  useAddStudentMutation,
  useCreateQuestionMutation,
  useAssignHomeworkMutation,
  useGetIdGenQuery,
  useGetScoreQuery,
} = firestoreApi;
