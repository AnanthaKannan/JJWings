import { configureStore } from '@reduxjs/toolkit';
import { firestoreApi } from './api';
import commonReducer from './slices';

export const store = configureStore({
  reducer: {
    common: commonReducer,
    [firestoreApi.reducerPath]: firestoreApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(firestoreApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
