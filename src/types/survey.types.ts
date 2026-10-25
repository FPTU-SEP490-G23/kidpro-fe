export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT';

export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface SurveyQuestionConfig {
  id?: string;
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  orderIndex: number;
  options?: string[];
}

export interface SurveySummaryItem {
  id: string;
  title: string;
  description?: string;
  targetGradeLevel: string;
  targetGradeLevelLabel: string;
  startDate: string;
  endDate: string;
  status: SurveyStatus;
  statusLabel: string;
  questionsCount: number;
  responsesCount: number;
  createdAt: string;
}

export interface SurveyDetailDTO extends SurveySummaryItem {
  questions: SurveyQuestionConfig[];
}

export interface SurveyOptionStat {
  label: string;
  count: number;
  percentage: number;
}

export interface SurveyQuestionAnalytics {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalAnswers: number;
  optionStats?: SurveyOptionStat[];
  ratingAverage?: number;
  ratingDistribution?: Record<number, number>;
  textFeedbackList?: string[];
}

export interface SurveyAnalyticsResponse {
  surveyId: string;
  title: string;
  totalResponses: number;
  status: SurveyStatus;
  questions: SurveyQuestionAnalytics[];
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  targetGradeLevel?: string;
  startDate: string;
  endDate: string;
  isDraft?: boolean;
  questions: {
    questionText: string;
    questionType: QuestionType;
    isRequired?: boolean;
    orderIndex?: number;
    options?: string[];
  }[];
}

export interface SubmitSurveyResponsePayload {
  studentId?: string;
  answers: {
    questionId: string;
    answerValue: string;
  }[];
}
