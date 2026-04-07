import type { VocabularyWord } from "@/data/hsk1Vocabulary";
import type {
  HSKQuizQuestion,
  QuizSettings,
  QuizQuestionType,
  HSKLevel,
} from "@/types/hsk";

export interface GeneratedQuiz {
  id: string;
  level: HSKLevel;
  title: string;
  questions: HSKQuizQuestion[];
  timeLimit: number | null;
  passingScore: number;
  settings: QuizSettings;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random options for multiple choice questions
function getRandomOptions(
  correctAnswer: string,
  allWords: VocabularyWord[],
  field: keyof VocabularyWord,
  count: number = 4
): string[] {
  const options = new Set<string>([correctAnswer]);
  const shuffled = shuffleArray(allWords);

  for (const word of shuffled) {
    if (options.size >= count) break;
    const value = word[field];
    if (typeof value === "string" && value !== correctAnswer) {
      options.add(value);
    }
  }

  return shuffleArray(Array.from(options));
}

// Generate a single question based on question type
function generateQuestion(
  word: VocabularyWord,
  allWords: VocabularyWord[],
  questionType: QuizQuestionType,
  questionIndex: number
): HSKQuizQuestion {
  const baseId = `q-${word.id}-${questionIndex}`;

  switch (questionType) {
    case "chinese-to-english":
      return {
        id: baseId,
        type: "multiple_choice",
        chinese: word.chinese,
        options: getRandomOptions(word.english, allWords, "english"),
        correctAnswer: word.english,
        points: 10,
      };

    case "english-to-chinese":
      return {
        id: baseId,
        type: "multiple_choice",
        english: word.english,
        options: getRandomOptions(word.chinese, allWords, "chinese"),
        correctAnswer: word.chinese,
        points: 10,
      };

    case "pinyin-to-english":
      return {
        id: baseId,
        type: "multiple_choice",
        pinyin: word.pinyin,
        options: getRandomOptions(word.english, allWords, "english"),
        correctAnswer: word.english,
        points: 10,
      };

    case "pinyin-to-chinese":
      return {
        id: baseId,
        type: "multiple_choice",
        pinyin: word.pinyin,
        options: getRandomOptions(word.chinese, allWords, "chinese"),
        correctAnswer: word.chinese,
        points: 10,
      };

    case "english-to-pinyin":
      return {
        id: baseId,
        type: "multiple_choice",
        english: word.english,
        options: getRandomOptions(word.pinyin, allWords, "pinyin"),
        correctAnswer: word.pinyin,
        points: 10,
      };

    case "chinese-to-pinyin":
      return {
        id: baseId,
        type: "multiple_choice",
        chinese: word.chinese,
        options: getRandomOptions(word.pinyin, allWords, "pinyin"),
        correctAnswer: word.pinyin,
        points: 10,
      };

    default:
      throw new Error(`Unknown question type: ${questionType}`);
  }
}

// Generate a complete quiz based on settings
export function generateQuiz(
  vocabulary: VocabularyWord[],
  settings: QuizSettings,
  level: HSKLevel
): GeneratedQuiz {
  // Filter words by range
  let availableWords = vocabulary.filter(
    (word) =>
      word.id >= settings.wordRange.start && word.id <= settings.wordRange.end
  );

  // Shuffle if randomize is enabled
  if (settings.randomize) {
    availableWords = shuffleArray(availableWords);
  }

  // Select words for the quiz
  const selectedWords = availableWords.slice(0, settings.questionCount);

  // Generate questions
  const questions: HSKQuizQuestion[] = [];
  selectedWords.forEach((word, index) => {
    // Randomly select a question type from the enabled types
    const questionType =
      settings.questionTypes[Math.floor(Math.random() * settings.questionTypes.length)];
    questions.push(generateQuestion(word, vocabulary, questionType, index));
  });

  // Shuffle questions if randomize is enabled
  const finalQuestions = settings.randomize ? shuffleArray(questions) : questions;

  return {
    id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    level,
    title: `HSK ${level} Quiz - ${settings.questionCount} Questions`,
    questions: finalQuestions,
    timeLimit: settings.timeLimit ? settings.timeLimit * 60 : null, // Convert minutes to seconds
    passingScore: 60,
    settings,
  };
}

// Generate shareable quiz link
export function generateQuizShareLink(quizId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/hsk/quiz/${quizId}`;
}

// Parse quiz ID from share link
export function parseQuizIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/hsk\/quiz\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
