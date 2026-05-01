// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  studentId: string | null;
  isAuthenticated: boolean;
  questions: string[];
  questionId: string | null;
}

const initialState: AuthState = {
  studentId: null,
  isAuthenticated: false,
  questions: [],
  questionId: null,
};

const commonSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ studentId: string }>) => {
      state.studentId = action.payload.studentId;
      state.isAuthenticated = true;
    },
    setQuestions: (
      state,
      action: PayloadAction<{ questions: string[]; questionId: string }>,
    ) => {
      state.questions = action.payload.questions;
      state.questionId = action.payload.questionId;
    },
    logout: state => {
      state.studentId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout, setQuestions } = commonSlice.actions;
export default commonSlice.reducer;
