import { configureStore } from '@reduxjs/toolkit';
import { jjWingsApi } from './api';
import commonReducer from './slices';

export const store = configureStore({
  reducer: {
    common: commonReducer,
    [jjWingsApi.reducerPath]: jjWingsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(jjWingsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
