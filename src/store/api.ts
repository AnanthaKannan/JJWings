// src/store/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { db } from '../firebase/config';
import { getDocs, collection, addDoc } from 'firebase/firestore';

export const firestoreApi = createApi({
  reducerPath: 'firestoreApi',
  baseQuery: fakeBaseQuery(), // ← key for non-HTTP apis
  endpoints: builder => ({
    // GET questions
    getQuestions: builder.query({
      queryFn: async () => {
        try {
          const snap = await getDocs(collection(db, 'user'));
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          return { data };
        } catch (e: any) {
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

export const { useGetQuestionsQuery, useSubmitResultMutation } = firestoreApi;
