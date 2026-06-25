import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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
