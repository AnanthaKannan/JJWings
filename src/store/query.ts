import { db } from '../firebase/config';
import {
  getDocs,
  collection,
  query,
  getDoc,
  where,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { HomeworkState } from '../util/enum';

const STUDENTS = 'students';
const HOMEWORKS = 'homeworks';
const QUESTIONS = 'questions';
const SCORES = 'scores';
const IDGEN = 'idgen';
const INITIAL_STUDENT_ID = 101;

export type Student = {
  id: string;
  name: string;
  studentId?: string;
  assigned: number;
  success: number;
  failure: number;
};

export type Question = {
  question?: string[];
};

export type Homework = {
  id: string;
  studentId: string;
  questionId: string;
  question?: Question;
  state: 'PROGRESS' | 'NEW' | 'COMPLETED';
  result: boolean[];
  answer: number[];
  timer: number;
};

export type IdGenData = {
  studentLastID: number;
};

const login = async (studentId: string, password: string) => {
  const ref = doc(db, STUDENTS, studentId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error('Student not found');

  const data = snap.data();
  if (data.password !== password)
    // compare hash in production
    throw new Error('Invalid password');

  return { id: snap.id, name: data.name };
};

const listStudents = async (): Promise<Student[]> => {
  const snapshot = await getDocs(collection(db, STUDENTS));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as Omit<Student, 'id'>;

    return {
      id: docSnap.id,
      name: data.name ?? '',
      studentId: data.studentId,
      assigned: data.assigned ?? 0,
      success: data.success ?? 0,
      failure: data.failure ?? 0,
    };
  });
};
const getHomeworks = async (studentId: string): Promise<Homework[]> => {
  console.log('studentId', studentId);
  const q = query(
    collection(db, HOMEWORKS),
    where('studentId', '==', studentId),
  );
  const snapshot = await getDocs(q);
  const homeworks = snapshot.docs.map(d => {
    const data = d.data() as Omit<Homework, 'id'>;
    return { id: d.id, ...data };
  });

  // Fetch linked question for each homework
  const enriched = await Promise.all(
    homeworks.map(async hw => {
      const qSnap = await getDoc(doc(db, QUESTIONS, hw.questionId));
      return { ...hw, question: qSnap.data() as Question };
    }),
  );
  return enriched;
};

const getHomeworkById = async (
  homeworkId: string,
): Promise<Homework | undefined> => {
  const qSnap = await getDoc(doc(db, HOMEWORKS, homeworkId));
  if (!qSnap.exists()) return undefined;

  return { id: qSnap.id, ...(qSnap.data() as Omit<Homework, 'id'>) };
};

const getIdGenData = async (): Promise<IdGenData> => {
  const qSnap = await getDoc(doc(db, IDGEN, 'idgen'));
  const data = (qSnap.data() || {}) as Partial<IdGenData>;
  if (!data?.studentLastID) {
    data.studentLastID = INITIAL_STUDENT_ID;
  }
  return { studentLastID: data.studentLastID };
};

type BadgeType = 'PROGRESS' | 'NEW' | 'COMPLETED';

const updateHomework = async (
  homeworkId: string,
  state: BadgeType,
  result: boolean[],
  answer: number[],
  timer: number,
  success: number = 0,
  failure: number = 0,
) => {
  await updateDoc(doc(db, HOMEWORKS, homeworkId), {
    state,
    result,
    answer,
    timer,
    updatedAt: serverTimestamp(),
  });

  // If completed, upsert score record
  if (state === HomeworkState.COMPLETED) {
    const hw = (await getDoc(doc(db, HOMEWORKS, homeworkId))).data();
    if (!hw) return;

    const scoreRef = doc(collection(db, SCORES));
    await setDoc(scoreRef, {
      studentId: hw.studentId,
      homeworkId,
      success,
      failure,
      createdAt: serverTimestamp(),
    });
  }
};

const addStudent = async (
  studentId: string,
  name: string,
  password: string,
  studentLastID: number,
) => {
  // Using studentId as the doc ID for easy lookup
  await setDoc(doc(db, STUDENTS, studentId), {
    studentId: studentId,
    name: name,
    password: password, // hash this — never store plain text
    success: 0,
    failure: 0,
    assigned: 0,
    timer: 0,
  });

  await setDoc(doc(db, IDGEN, 'idgen'), {
    studentLastID: studentLastID + 1,
  });
};

export {
  login,
  getHomeworks,
  updateHomework,
  getHomeworkById,
  listStudents,
  addStudent,
  getIdGenData,
};
