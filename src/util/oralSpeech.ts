import { NativeModules } from 'react-native';

type OralTtsModule = {
  speak?: (text: string, rate: number) => void;
  stop?: () => void;
};

const OralTts = NativeModules.OralTts as OralTtsModule | undefined;
export const ORAL_SPEECH_RATE = 0.75;
let hasWarnedMissingModule = false;

export const formatQuestionForSpeech = (question = '') => {
  return question
    .replace(/\s+/g, '')
    .replace(/\+/g, ' plus ')
    .replace(/-/g, ' minus ')
    .replace(/\*/g, ' times ')
    .replace(/\//g, ' divided by ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const speakOralQuestion = (question: string, rate = ORAL_SPEECH_RATE) => {
  const spokenQuestion = formatQuestionForSpeech(question);
  if (!spokenQuestion) return false;

  if (!OralTts?.speak) {
    if (!hasWarnedMissingModule) {
      hasWarnedMissingModule = true;
      console.warn('OralTts native module is unavailable. Rebuild the Android app.');
    }
    return false;
  }

  OralTts.speak(spokenQuestion, rate);
  return true;
};

export const stopOralQuestionSpeech = () => {
  OralTts?.stop?.();
};
