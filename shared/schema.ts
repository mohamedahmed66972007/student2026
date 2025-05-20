import { pgTable, text, serial, integer, timestamp, pgEnum, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Enum for subject types
export const subjectEnum = pgEnum("subject_type", [
  "arabic",
  "english",
  "math",
  "chemistry",
  "physics",
  "biology",
  "constitution",
  "islamic",
]);

// Enum for semester types
export const semesterEnum = pgEnum("semester_type", ["first", "second"]);

// Enum for exam question types
export const questionTypeEnum = pgEnum("question_type", [
  "multipleChoice",
  "trueFalse",
  "shortAnswer",
]);

// Files schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  semester: text("semester").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadDate: text("upload_date").notNull(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadDate: true,
});

// School exams schedule schema
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  room: text("room").notNull(),
  notes: text("notes"),
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
});

// Weekly schedule schema
export const weeklySchedule = pgTable("weekly_schedule", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // الأحد، الاثنين، الخ
  date: text("date").notNull(),
  subject: text("subject"),
  topics: text("topics"),
  hasExam: boolean("has_exam").default(false),
});

export const insertWeeklyScheduleSchema = createInsertSchema(weeklySchedule).omit({
  id: true,
});

// Quizzes schema
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // رمز الاختبار الفريد للبحث
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  creatorName: text("creator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  questions: json("questions").notNull().$type<QuizQuestion[]>(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

// Quiz attempts schema
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userName: text("user_name").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: json("answers").notNull().$type<QuizAnswer[]>(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

export type InsertWeeklySchedule = z.infer<typeof insertWeeklyScheduleSchema>;
export type WeeklySchedule = typeof weeklySchedule.$inferSelect;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Quiz Question type
export interface QuizQuestion {
  id: string;
  type: "multipleChoice" | "trueFalse" | "shortAnswer";
  text: string;
  options?: string[];
  correctAnswer: string | string[];
}

// Quiz Answer type
export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
}

// File upload validation schema
export const fileUploadSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب ويجب أن يكون على الأقل 3 أحرف"),
  subject: z.enum(["arabic", "english", "math", "chemistry", "physics", "biology", "constitution", "islamic"], {
    required_error: "المادة مطلوبة",
  }),
  semester: z.enum(["first", "second"], {
    required_error: "الفصل الدراسي مطلوب",
  }),
  file: z.instanceof(File, { message: "الملف مطلوب" }).optional(),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

// Quiz validation schema
export const quizSchema = z.object({
  title: z.string().min(3, "عنوان الاختبار مطلوب"),
  subject: z.string().min(1, "مادة الاختبار مطلوبة"),
  creatorName: z.string().min(1, "اسم منشئ الاختبار مطلوب"),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["multipleChoice", "trueFalse", "shortAnswer"]),
      text: z.string().min(1, "نص السؤال مطلوب"),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.array(z.string())]),
    })
  ).min(1, "يجب إضافة سؤال واحد على الأقل"),
});

export type QuizData = z.infer<typeof quizSchema>;

// Quiz attempt validation schema
export const quizAttemptSchema = z.object({
  quizId: z.number(),
  userName: z.string().min(1, "الاسم مطلوب"),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
    })
  ),
});

export type QuizAttemptData = z.infer<typeof quizAttemptSchema>;
