// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  studentId: string | null;
  isStudent: boolean;
  isAuthenticated: boolean;
  questions: string[];
  result: boolean[];
  answer: number[];
  timer: number;
  homeworkId: string | null;
  questionId: string | null;
  name: string;
}

const initialState: AuthState = {
  studentId: null,
  name: '',
  isAuthenticated: false,
  isStudent: false,
  questions: [],
  result: [],
  answer: [],
  homeworkId: null,
  questionId: '',
  timer: 0,
};

const commonSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        studentId: string;
        isStudent: boolean;
        name: string;
      }>,
    ) => {
      state.studentId = action.payload.studentId;
      state.name = action.payload.name;
      state.isStudent = action.payload.isStudent;
      state.isAuthenticated = true;
    },
    setQuestions: (
      state,
      action: PayloadAction<{
        questions: string[];
        homeworkId: string;
        questionId: string;
        result: boolean[];
        answer: number[];
        timer: number;
      }>,
    ) => {
      state.questions = action.payload.questions;
      state.homeworkId = action.payload.homeworkId;
      state.questionId = action.payload.questionId;
      state.result = action.payload.result;
      state.answer = action.payload.answer;
      state.timer = action.payload.timer;
    },
    logout: state => {
      state.studentId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout, setQuestions } = commonSlice.actions;
export default commonSlice.reducer;
