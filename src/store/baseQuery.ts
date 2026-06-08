import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Config from 'react-native-config';

import type { RootState } from './store';

const API_URL =
  Config.API_URL?.replace(/\/$/, '') ||
  'https://jjwingabackend.onrender.com/v1/api';

export const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).common.token;

    headers.set('Accept', 'application/json');

    if (token && !headers.has('x-access-token')) {
      headers.set('x-access-token', token);
    }

    return headers;
  },
});
