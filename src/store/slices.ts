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
  studentName: string;
  token: string | null;
  adminId: string;
  adminName: string;
  isAdmin: boolean;
}

const initialState: AuthState = {
  studentId: null,
  studentName: '',
  isAuthenticated: false,
  isStudent: false,
  questions: [],
  result: [],
  answer: [],
  homeworkId: null,
  questionId: '',
  timer: 0,
  token: null,
  adminId: '',
  adminName: '',
  isAdmin: false,
};

const commonSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setStudentCredentials: (
      state,
      action: PayloadAction<{
        studentId: string;
        isStudent: boolean;
        studentName: string;
        token?: string;
      }>,
    ) => {
      state.studentId = action.payload.studentId;
      state.studentName = action.payload.studentName;
      state.isStudent = action.payload.isStudent;
      state.adminId = '';
      state.adminName = '';
      state.isAdmin = false;
      state.isAuthenticated = true;
      state.token = action.payload.token ?? null;
    },
    setAdminCredentials: (
      state,
      action: PayloadAction<{
        adminId: string;
        isAdmin: boolean;
        adminName: string;
        token?: string;
      }>,
    ) => {
      state.adminId = action.payload.adminId;
      state.adminName = action.payload.adminName;
      state.isAdmin = true;
      state.studentId = null;
      state.studentName = '';
      state.isStudent = false;
      state.isAuthenticated = true;
      state.token = action.payload.token ?? null;
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
      state.studentName = '';
      state.adminId = '';
      state.adminName = '';
      state.isStudent = false;
      state.isAdmin = false;
      state.isAuthenticated = false;
      state.token = null;
    },
  },
});

export const {
  setStudentCredentials,
  setAdminCredentials,
  logout,
  setQuestions,
} = commonSlice.actions;
export default commonSlice.reducer;
