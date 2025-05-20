import { 
  users, type User, type InsertUser,
  files, type File, type InsertFile,
  exams, type Exam, type InsertExam,
  weeklySchedule, type WeeklySchedule, type InsertWeeklySchedule,
  quizzes, type Quiz, type InsertQuiz,
  quizAttempts, type QuizAttempt, type InsertQuizAttempt
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File methods
  getAllFiles(): Promise<File[]>;
  getFileById(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  getFilesByFilter(subject?: string, semester?: string): Promise<File[]>;
  getLatestFiles(limit: number): Promise<File[]>;
  
  // Exam methods
  getAllExams(): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExams(exams: InsertExam[]): Promise<Exam[]>;
  
  // Weekly Schedule methods
  getAllWeeklySchedules(): Promise<WeeklySchedule[]>;
  updateWeeklySchedules(schedules: InsertWeeklySchedule[]): Promise<WeeklySchedule[]>;
  
  // Quiz methods
  getAllQuizzes(): Promise<Quiz[]>;
  getQuizById(id: number): Promise<Quiz | undefined>;
  getQuizByCode(code: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: number, creatorName: string): Promise<void>;
  searchQuizzes(searchTerm: string): Promise<Quiz[]>;
  
  // Quiz Attempt methods
  getQuizAttempts(quizId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserAttemptForQuiz(quizId: number, userName: string): Promise<QuizAttempt | undefined>;
  
  // Session store
  sessionStore: session.Store;
  
  // Utils
  generateUniqueQuizCode(): string;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  uploadsDir: string;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Setup uploads directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.uploadsDir = path.resolve(__dirname, '..', 'uploads');
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // File methods
  async getAllFiles(): Promise<File[]> {
    return await db.select().from(files).orderBy(desc(files.uploadDate));
  }

  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }

  async getFilesByFilter(subject?: string, semester?: string): Promise<File[]> {
    let query = db.select().from(files);
    
    if (subject && subject !== 'all') {
      query = query.where(eq(files.subject, subject as any));
    }
    
    if (semester && semester !== 'all') {
      query = query.where(eq(files.semester, semester as any));
    }
    
    return await query.orderBy(desc(files.uploadDate));
  }
  
  async getLatestFiles(limit: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .orderBy(desc(files.uploadDate))
      .limit(limit);
  }

  // Exam methods
  async getAllExams(): Promise<Exam[]> {
    return await db.select().from(exams);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(insertExam)
      .returning();
    return exam;
  }

  async updateExams(insertExams: InsertExam[]): Promise<Exam[]> {
    // Clear existing exams
    await db.delete(exams);
    
    // Insert new exams
    if (insertExams.length > 0) {
      return await db
        .insert(exams)
        .values(insertExams)
        .returning();
    }
    
    return [];
  }
  
  // Weekly Schedule methods
  async getAllWeeklySchedules(): Promise<WeeklySchedule[]> {
    return await db
      .select()
      .from(weeklySchedule)
      .orderBy(weeklySchedule.id);
  }
  
  async updateWeeklySchedules(schedules: InsertWeeklySchedule[]): Promise<WeeklySchedule[]> {
    // Clear existing schedules
    await db.delete(weeklySchedule);
    
    // Insert new schedules
    if (schedules.length > 0) {
      return await db
        .insert(weeklySchedule)
        .values(schedules)
        .returning();
    }
    
    return [];
  }
  
  // Quiz methods
  async getAllQuizzes(): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .orderBy(desc(quizzes.createdAt));
  }
  
  async getQuizById(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id));
    return quiz;
  }
  
  async getQuizByCode(code: string): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.code, code));
    return quiz;
  }
  
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    // Generate a unique code for the quiz
    if (!insertQuiz.code) {
      insertQuiz.code = this.generateUniqueQuizCode();
    }
    
    const [quiz] = await db
      .insert(quizzes)
      .values(insertQuiz)
      .returning();
    return quiz;
  }
  
  async deleteQuiz(id: number, creatorName: string): Promise<void> {
    // Only creator or admin can delete
    const quiz = await this.getQuizById(id);
    
    if (quiz && (quiz.creatorName === creatorName || creatorName === 'admin')) {
      // First delete all attempts
      await db
        .delete(quizAttempts)
        .where(eq(quizAttempts.quizId, id));
        
      // Then delete the quiz
      await db
        .delete(quizzes)
        .where(eq(quizzes.id, id));
    } else {
      throw new Error('غير مصرح لك بحذف هذا الاختبار');
    }
  }
  
  async searchQuizzes(searchTerm: string): Promise<Quiz[]> {
    if (!searchTerm) {
      return await this.getAllQuizzes();
    }
    
    // استخدم استعلام SQL مباشر للبحث عن الاختبارات
    // هذا يتجنب مشكلة تحويل الهياكل الدائرية إلى JSON
    try {
      const { rows } = await pool.query(`
        SELECT * FROM quizzes 
        WHERE UPPER(code) = UPPER($1) 
        OR title ILIKE $2 
        OR subject ILIKE $2 
        OR creator_name ILIKE $2
        ORDER BY created_at DESC
      `, [searchTerm, `%${searchTerm}%`]);
      
      // تحويل البيانات من قاعدة البيانات إلى الشكل المطلوب
      return rows.map(row => ({
        id: Number(row.id),
        code: row.code,
        title: row.title,
        subject: row.subject,
        creatorName: row.creator_name,
        createdAt: new Date(row.created_at),
        questions: row.questions
      }));
    } catch (error) {
      console.error("Error searching quizzes:", error);
      return [];
    }
  }
  
  // Quiz Attempt methods
  async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.completedAt));
  }
  
  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db
      .insert(quizAttempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }
  
  async getUserAttemptForQuiz(quizId: number, userName: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userName, userName)
        )
      );
    return attempt;
  }
  
  // Utils
  generateUniqueQuizCode(): string {
    // Generate a 6-character alphanumeric code
    return randomBytes(3).toString('hex').toUpperCase();
  }
}

function or(...conditions: unknown[]): any {
  // Simple OR implementation for this specific use case
  return { type: 'or', conditions };
}

export const storage = new DatabaseStorage();
