// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  studentId: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  studentId: null,
  isAuthenticated: false,
};

const commonSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ studentId: string }>) => {
      state.studentId = action.payload.studentId;
      state.isAuthenticated = true;
    },
    logout: state => {
      state.studentId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = commonSlice.actions;
export default commonSlice.reducer;
