// src/store/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { db } from '../firebase/config';
import { getDocs, collection, addDoc } from 'firebase/firestore';
import { login, getHomeworks } from './query';
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

    // SUBMIT result
    submitResult: builder.mutation({
      queryFn: async result => {
        try {
          await addDoc(collection(db, 'results'), result);
          return { data: 'success' };
        } catch (e: any) {
          return { error: e.message };
        }
      },
    }),
  }),
});

export const {
  useGetHomeworksQuery,
  useSubmitResultMutation,
  useLazyGetLoginQuery,
} = firestoreApi;
