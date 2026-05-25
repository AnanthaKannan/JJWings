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
  writeBatch,
  increment,
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
  horizontal: boolean;
  assigned: number;
  completed: number;
  new: number;
  success: number;
  failure: number;
};

export type Question = {
  question?: string[];
};

export type QuestionTask = {
  id: string;
  question: string[];
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

export type Score = {
  studentId: string;
  success: number;
  failure: number;
  timeTaken: number;
  completed: number;
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

const getStudentById = async (studentId: string): Promise<Student | undefined> => {
  const snap = await getDoc(doc(db, STUDENTS, studentId));
  if (!snap.exists()) return undefined;

  const data = snap.data() as Omit<Student, 'id'>;

  return {
    id: snap.id,
    name: data.name ?? '',
    studentId: data.studentId,
    horizontal: data.horizontal ?? false,
    assigned: data.assigned ?? 0,
    completed: data.completed ?? 0,
    new: data.new ?? 0,
    success: data.success ?? 0,
    failure: data.failure ?? 0,
  };
};

const listStudents = async (): Promise<Student[]> => {
  const [studentSnapshot, homeworkSnapshot] = await Promise.all([
    getDocs(collection(db, STUDENTS)),
    getDocs(collection(db, HOMEWORKS)),
  ]);

  const homeworkCounts = homeworkSnapshot.docs.reduce<
    Record<string, { assigned: number; completed: number; new: number }>
  >((counts, homeworkSnap) => {
    const homework = homeworkSnap.data() as Homework;
    const studentId = homework.studentId;

    if (!studentId) return counts;

    counts[studentId] ??= { assigned: 0, completed: 0, new: 0 };
    counts[studentId].assigned += 1;

    if (homework.state === HomeworkState.COMPLETED) {
      counts[studentId].completed += 1;
    }

    if (homework.state === HomeworkState.NEW) {
      counts[studentId].new += 1;
    }

    return counts;
  }, {});

  return studentSnapshot.docs.map(docSnap => {
    const data = docSnap.data() as Omit<Student, 'id'>;
    const counts = homeworkCounts[docSnap.id];

    return {
      id: docSnap.id,
      name: data.name ?? '',
      studentId: data.studentId,
      horizontal: data.horizontal ?? false,
      assigned: counts?.assigned ?? data.assigned ?? 0,
      completed: counts?.completed ?? data.completed ?? 0,
      new: counts?.new ?? data.new ?? 0,
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

    return {
      id: d.id,
      studentId: data.studentId,
      questionId: data.questionId,
      state: data.state ?? HomeworkState.NEW,
      result: data.result ?? [],
      answer: data.answer ?? [],
      timer: data.timer ?? 0,
    };
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

  const data = qSnap.data() as Omit<Homework, 'id'>;

  return {
    id: qSnap.id,
    studentId: data.studentId,
    questionId: data.questionId,
    state: data.state ?? HomeworkState.NEW,
    result: data.result ?? [],
    answer: data.answer ?? [],
    timer: data.timer ?? 0,
  };
};

const getIdGenData = async (): Promise<IdGenData> => {
  const qSnap = await getDoc(doc(db, IDGEN, 'idgen'));
  const data = (qSnap.data() || {}) as Partial<IdGenData>;
  if (!data?.studentLastID) {
    data.studentLastID = INITIAL_STUDENT_ID;
  }
  return { studentLastID: data.studentLastID };
};

const listQuestions = async (): Promise<QuestionTask[]> => {
  const snapshot = await getDocs(collection(db, QUESTIONS));

  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as Question;

    return {
      id: docSnap.id,
      question: data.question ?? [],
    };
  });
};

const createQuestion = async (taskId: string, question: string[]) => {
  const questionRef = doc(db, QUESTIONS, taskId);
  const existingQuestion = await getDoc(questionRef);

  if (existingQuestion.exists()) {
    throw new Error('Task identifier already exists');
  }

  await setDoc(questionRef, {
    question,
    updatedAt: serverTimestamp(),
  });
};

const assignHomework = async (studentId: string, questionIds: string[]) => {
  if (questionIds.length === 0) return;

  const homeworkRefs = questionIds.map(questionId => ({
    questionId,
    ref: doc(db, HOMEWORKS, `${studentId}_${questionId}`),
  }));

  const existingHomeworks = await Promise.all(
    homeworkRefs.map(({ ref }) => getDoc(ref)),
  );
  const alreadyAssignedIndex = existingHomeworks.findIndex(snap =>
    snap.exists(),
  );

  if (alreadyAssignedIndex >= 0) {
    throw new Error(
      `${homeworkRefs[alreadyAssignedIndex].questionId} is already assigned to this student`,
    );
  }

  const batch = writeBatch(db);

  homeworkRefs.forEach(({ ref, questionId }) => {
    batch.set(ref, {
      studentId,
      questionId,
      state: HomeworkState.NEW,
      result: [],
      answer: [],
      timer: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  batch.update(doc(db, STUDENTS, studentId), {
    assigned: increment(questionIds.length),
  });

  await batch.commit();
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

  // Keep one accumulated score document per student for dashboard summaries.
  if (state === HomeworkState.COMPLETED) {
    const hw = (await getDoc(doc(db, HOMEWORKS, homeworkId))).data();
    if (!hw?.studentId) return;

    const scoreRef = doc(db, SCORES, hw.studentId);
    await setDoc(scoreRef, {
      studentId: hw.studentId,
      success: increment(success),
      failure: increment(failure),
      timeTaken: increment(timer),
      completed: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
};

const getScore = async (studentId: string): Promise<Score> => {
  const scoreSnap = await getDoc(doc(db, SCORES, studentId));
  const data = (scoreSnap.data() || {}) as Partial<Score>;

  return {
    studentId,
    success: data.success ?? 0,
    failure: data.failure ?? 0,
    timeTaken: data.timeTaken ?? 0,
    completed: data.completed ?? 0,
  };
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
    horizontal: false,
  });

  await setDoc(doc(db, IDGEN, 'idgen'), {
    studentLastID: studentLastID + 1,
  });
};

const updateStudentHorizontal = async (
  studentId: string,
  horizontal: boolean,
) => {
  await updateDoc(doc(db, STUDENTS, studentId), {
    horizontal,
    updatedAt: serverTimestamp(),
  });
};

export {
  login,
  getHomeworks,
  updateHomework,
  getHomeworkById,
  getStudentById,
  listStudents,
  listQuestions,
  addStudent,
  createQuestion,
  assignHomework,
  getIdGenData,
  getScore,
  updateStudentHorizontal,
};
