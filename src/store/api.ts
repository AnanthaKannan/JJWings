// src/store/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  query,
  where,
} from 'firebase/firestore';

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

    getLogin: builder.query({
      queryFn: async ({ userId }) => {
        try {
          const ref = doc(db, 'user', userId); // 👈 specify document ID
          const snap = await getDoc(ref);

          if (snap.exists()) {
            return { data: snap.data() };
          } else {
            return { error: 'Invalid username or password' };
          }

          // Build query with where filters
          // const q = query(
          //   collection(db, 'user'),
          //   where('name', '==', userName),
          //   where('password', '==', password),
          // );

          // const snap = await getDocs(q);

          // // No matching user found
          // if (snap.empty) {
          //   return { error: 'Invalid username or password' };
          // }

          // // Return first matched user
          // const user = snap.docs[0];
          // const data = { id: user.id, ...user.data() };

          // return { data };
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

export const {
  useGetQuestionsQuery,
  useSubmitResultMutation,
  useGetLoginQuery,
  useLazyGetLoginQuery,
} = firestoreApi;
