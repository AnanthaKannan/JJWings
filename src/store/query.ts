import { db } from '../firebase/config';
import {
  getDocs,
  collection,
  query,
  getDoc,
  where,
  doc,
} from 'firebase/firestore';

const STUDENTS = 'students';
const HOMEWORKS = 'homeworks';
const QUESTIONS = 'questions';

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

export { login, getHomeworks };
