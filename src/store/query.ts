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

const listStudents = async () => {
  const snapshot = await getDocs(collection(db, STUDENTS));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
const getHomeworks = async (studentId: string) => {
  console.log('studentId', studentId);
  const q = query(
    collection(db, HOMEWORKS),
    where('studentId', '==', studentId),
  );
  const snapshot = await getDocs(q);
  const homeworks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Fetch linked question for each homework
  const enriched = await Promise.all(
    homeworks.map(async hw => {
      const qSnap = await getDoc(doc(db, QUESTIONS, hw.questionId));
      return { ...hw, question: qSnap.data() };
    }),
  );
  return enriched;
};

const getHomeworkById = async (homeworkId: string) => {
  const qSnap = await getDoc(doc(db, HOMEWORKS, homeworkId));
  return qSnap.data();
};

type BadgeType = 'PROGRESS' | 'NEW' | 'COMPLETED';

const updateHomework = async (
  homeworkId: string,
  state: BadgeType,
  result: string[],
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
) => {
  // Using studentId as the doc ID for easy lookup
  await setDoc(doc(db, STUDENTS, studentId), {
    name: name,
    password: password, // hash this — never store plain text
    success: 0,
    failure: 0,
    assigned: 0,
    timer: 0,
  });
};

export {
  login,
  getHomeworks,
  updateHomework,
  getHomeworkById,
  listStudents,
  addStudent,
};
