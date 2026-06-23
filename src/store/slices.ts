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
  oral: boolean;
  homeworkId: string | null;
  questionId: string | null;
  studentName: string;
  studentProfilePic: string | null;
  token: string | null;
  adminId: string;
  adminCode: string | null;
  adminName: string;
  adminProfilePic: string | null;
  adminOrgId: string | null;
  adminRoles: string[];
  isAdmin: boolean;
  vertical: boolean;
  hasNotificationAttention: boolean;
  messageUnreadCount: number;
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
  oral: false,
  token: null,
  adminId: '',
  adminCode: null,
  adminName: '',
  adminProfilePic: null,
  adminOrgId: null,
  adminRoles: [],
  isAdmin: false,
  vertical: false,
  hasNotificationAttention: false,
  messageUnreadCount: 0,
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
        adminOrgId?: string | null;
        adminRoles?: string[];
        token?: string;
      }>,
    ) => {
      state.adminId = action.payload.adminId;
      state.adminCode = action.payload.adminCode ?? null;
      state.adminName = action.payload.adminName;
      state.adminProfilePic = action.payload.adminProfilePic ?? null;
      state.adminOrgId = action.payload.adminOrgId ?? null;
      state.adminRoles = action.payload.adminRoles ?? [];
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
        oral?: boolean;
      }>,
    ) => {
      state.questions = action.payload.questions;
      state.marks = action.payload.marks ?? [];
      state.homeworkId = action.payload.homeworkId;
      state.questionId = action.payload.questionId;
      state.result = action.payload.result;
      state.answer = action.payload.answer;
      state.timer = action.payload.timer;
      state.oral = action.payload.oral ?? false;
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
      state.adminOrgId = null;
      state.adminRoles = [];
      state.isStudent = false;
      state.isAdmin = false;
      state.isAuthenticated = false;
      state.token = null;
      state.hasNotificationAttention = false;
      state.messageUnreadCount = 0;
    },
    showNotificationAttention: state => {
      state.hasNotificationAttention = true;
    },
    clearNotificationAttention: state => {
      state.hasNotificationAttention = false;
    },
    setMessageUnreadCount: (state, action: PayloadAction<number>) => {
      state.messageUnreadCount = Math.max(0, action.payload);
    },
    reduceMessageUnreadCount: (state, action: PayloadAction<number>) => {
      state.messageUnreadCount = Math.max(
        0,
        state.messageUnreadCount - action.payload,
      );
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
  setMessageUnreadCount,
  reduceMessageUnreadCount,
  setStudentProfilePic,
  setAdminProfilePic,
} = commonSlice.actions;
export default commonSlice.reducer;
