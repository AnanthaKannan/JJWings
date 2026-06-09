// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  studentId: string | null;
  studentCode: string | null;
  studentLevel: number | null;
  isStudent: boolean;
  isAuthenticated: boolean;
  questions: string[];
  marks: number[];
  result: boolean[];
  answer: number[];
  timer: number;
  homeworkId: string | null;
  questionId: string | null;
  studentName: string;
  studentProfilePic: string | null;
  token: string | null;
  adminId: string;
  adminCode: string | null;
  adminName: string;
  adminProfilePic: string | null;
  isAdmin: boolean;
  vertical: boolean;
  hasNotificationAttention: boolean;
}

const initialState: AuthState = {
  studentId: null,
  studentCode: null,
  studentLevel: null,
  studentName: '',
  studentProfilePic: null,
  isAuthenticated: false,
  isStudent: false,
  questions: [],
  marks: [],
  result: [],
  answer: [],
  homeworkId: null,
  questionId: '',
  timer: 0,
  token: null,
  adminId: '',
  adminCode: null,
  adminName: '',
  adminProfilePic: null,
  isAdmin: false,
  vertical: false,
  hasNotificationAttention: false,
};

const commonSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setStudentCredentials: (
      state,
      action: PayloadAction<{
        studentId: string;
        studentCode?: string | null;
        isStudent: boolean;
        studentName: string;
        studentLevel?: number;
        studentProfilePic?: string | null;
        token?: string;
        vertical: boolean;
      }>,
    ) => {
      state.studentId = action.payload.studentId;
      state.studentCode = action.payload.studentCode ?? null;
      state.studentLevel =
        typeof action.payload.studentLevel === 'number'
          ? action.payload.studentLevel
          : null;
      state.studentName = action.payload.studentName;
      state.studentProfilePic = action.payload.studentProfilePic ?? null;
      state.isStudent = action.payload.isStudent;
      state.isAdmin = false;
      state.isAuthenticated = true;
      state.token = action.payload.token ?? null;
      state.vertical = action.payload.vertical;
    },
    setAdminCredentials: (
      state,
      action: PayloadAction<{
        adminId: string;
        adminCode?: string | null;
        isAdmin: boolean;
        adminName: string;
        adminProfilePic?: string | null;
        token?: string;
      }>,
    ) => {
      state.adminId = action.payload.adminId;
      state.adminCode = action.payload.adminCode ?? null;
      state.adminName = action.payload.adminName;
      state.adminProfilePic = action.payload.adminProfilePic ?? null;
      state.studentLevel = null;
      state.isAdmin = true;
      state.isStudent = false;
      state.isAuthenticated = true;
      state.token = action.payload.token ?? null;
    },
    setQuestions: (
      state,
      action: PayloadAction<{
        questions: string[];
        marks?: number[];
        homeworkId: string;
        questionId: string;
        result: boolean[];
        answer: number[];
        timer: number;
      }>,
    ) => {
      state.questions = action.payload.questions;
      state.marks = action.payload.marks ?? [];
      state.homeworkId = action.payload.homeworkId;
      state.questionId = action.payload.questionId;
      state.result = action.payload.result;
      state.answer = action.payload.answer;
      state.timer = action.payload.timer;
    },
    logout: state => {
      state.studentId = null;
      state.studentCode = null;
      state.studentLevel = null;
      state.studentName = '';
      state.studentProfilePic = null;
      state.adminId = '';
      state.adminCode = null;
      state.adminName = '';
      state.adminProfilePic = null;
      state.isStudent = false;
      state.isAdmin = false;
      state.isAuthenticated = false;
      state.token = null;
      state.hasNotificationAttention = false;
    },
    showNotificationAttention: state => {
      state.hasNotificationAttention = true;
    },
    clearNotificationAttention: state => {
      state.hasNotificationAttention = false;
    },
    setStudentProfilePic: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.studentProfilePic = action.payload;
    },
    setAdminProfilePic: (state, action: PayloadAction<string | null>) => {
      state.adminProfilePic = action.payload;
    },
  },
});

export const {
  setStudentCredentials,
  setAdminCredentials,
  logout,
  setQuestions,
  showNotificationAttention,
  clearNotificationAttention,
  setStudentProfilePic,
  setAdminProfilePic,
} = commonSlice.actions;
export default commonSlice.reducer;
