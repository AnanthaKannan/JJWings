import { db } from '../firebase/config';
import { getDocs, collection, addDoc, getDoc, doc } from 'firebase/firestore';

const STUDENTS = 'students';

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

export { login };
