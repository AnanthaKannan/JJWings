import { fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import Config from 'react-native-config';

import type { RootState } from './store';

export const API_URL = Config.API_URL?.replace(/\/$/, '');

export const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;

    const token = state.common.token;
    const mockDeviceId = state.common.mockDeviceId;

    headers.set('Accept', 'application/json');

    if (token && !headers.has('x-access-token')) {
      headers.set('x-access-token', token);
    }

    if (mockDeviceId && !headers.has('x-device-id')) {
      headers.set('x-device-id', mockDeviceId); // 👈
    }

    return headers;
  },
});

export const baseQueryWithRetry = retry(
  async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    const status = (result.error as any)?.status;

    if (status === 401 || status === 403) {
      // Bail out immediately — don't retry auth failures
      retry.fail(result.error);
    }

    return result;
  },
  { maxRetries: 3 },
);
