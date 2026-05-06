// src/store/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  login,
  getHomeworks,
  updateHomework,
  getHomeworkById,
  listStudents,
  addStudent,
  getIdGenData,
} from './query';
export const firestoreApi = createApi({
  reducerPath: 'firestoreApi',
  baseQuery: fakeBaseQuery(), // ← key for non-HTTP apis
  endpoints: builder => ({
    // GET questions
    getHomeworks: builder.query({
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

    getHomeworkById: builder.query({
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

    getLogin: builder.query({
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

    getStudents: builder.query({
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

    getIdGen: builder.query({
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

    addStudent: builder.mutation({
      queryFn: async ({ studentId, name, password }) => {
        try {
          await addStudent(studentId, name, password);
          return { data: 'success' };
        } catch (e: any) {
          console.error(e);
          return { error: e.message };
        }
      },
    }),

    updateHomework: builder.mutation({
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
  useAddStudentMutation,
  useGetIdGenQuery,
} = firestoreApi;
