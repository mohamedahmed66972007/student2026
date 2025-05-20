import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { setupAuth } from "./auth";
import { 
  insertFileSchema, 
  insertExamSchema, 
  insertWeeklyScheduleSchema,
  quizSchema,
  quizAttemptSchema,
  QuizQuestion,
  QuizAnswer
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and PPTX are allowed.'));
    }
  }
});

// Auth middleware to protect admin routes
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up auth routes
  setupAuth(app);

  // File static serving from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // File routes
  app.get("/api/files", async (req, res) => {
    try {
      const subject = req.query.subject as string | undefined;
      const semester = req.query.semester as string | undefined;
      
      const files = await storage.getFilesByFilter(subject, semester);
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
  
  // Get latest files
  app.get("/api/files/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const files = await storage.getLatestFiles(limit);
      res.json(files);
    } catch (error) {
      console.error('Error fetching latest files:', error);
      res.status(500).json({ message: "Failed to fetch latest files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      console.error('Error fetching file:', error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/files", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const { title, subject, semester } = req.body;
      
      // Validate request
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileData = {
        title,
        subject,
        semester,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
      
      // Validate with Zod
      insertFileSchema.parse(fileData);
      
      const savedFile = await storage.createFile(fileData);
      res.status(201).json(savedFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Exam routes
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ message: "Failed to fetch exam schedule" });
    }
  });

  app.post("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const examsArray = req.body;
      
      if (!Array.isArray(examsArray)) {
        return res.status(400).json({ message: "Invalid exams data format" });
      }
      
      // Validate each exam with Zod
      const validatedExams = examsArray.map(exam => insertExamSchema.parse(exam));
      
      const savedExams = await storage.updateExams(validatedExams);
      res.status(201).json(savedExams);
    } catch (error) {
      console.error('Error updating exams:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: "Failed to update exam schedule" });
    }
  });

  // Download file route
  app.get("/api/download/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const filePath = path.join(uploadsDir, file.fileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server" });
      }
      
      res.download(filePath, file.originalName);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });
  
  // Weekly Schedule routes
  app.get("/api/weekly-schedule", async (req, res) => {
    try {
      const schedules = await storage.getAllWeeklySchedules();
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      res.status(500).json({ message: "Failed to fetch weekly schedule" });
    }
  });
  
  app.post("/api/weekly-schedule", isAuthenticated, async (req, res) => {
    try {
      const scheduleArray = req.body;
      
      if (!Array.isArray(scheduleArray)) {
        return res.status(400).json({ message: "Invalid schedule data format" });
      }
      
      // Validate each schedule with Zod
      const validatedSchedules = scheduleArray.map(schedule => 
        insertWeeklyScheduleSchema.parse(schedule)
      );
      
      const savedSchedules = await storage.updateWeeklySchedules(validatedSchedules);
      res.status(201).json(savedSchedules);
    } catch (error) {
      console.error('Error updating weekly schedule:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: "Failed to update weekly schedule" });
    }
  });
  
  // Quiz routes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });
  
  app.get("/api/quizzes/search", async (req, res) => {
    try {
      const term = req.query.term as string || '';
      
      if (term.trim() === '') {
        return res.json([]);
      }
      
      // البحث في قاعدة البيانات
      const quizzes = await storage.searchQuizzes(term);
      res.json(quizzes);
    } catch (error) {
      console.error('Error searching quizzes:', error);
      res.status(500).json({ message: "Failed to search quizzes" });
    }
  });
  
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuizById(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });
  
  app.get("/api/quizzes/code/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const quiz = await storage.getQuizByCode(code);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found with this code" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error('Error fetching quiz by code:', error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });
  
  app.post("/api/quizzes", async (req, res) => {
    try {
      const quizData = req.body;
      
      // Validate with Zod
      const validQuiz = quizSchema.parse(quizData);
      
      // Make sure each question has an ID
      validQuiz.questions.forEach((question: QuizQuestion) => {
        if (!question.id) {
          question.id = randomUUID();
        }
      });
      
      // Generate a unique code if not provided
      const uniqueCode = storage.generateUniqueQuizCode();
      const quizWithCode = {
        ...validQuiz,
        code: uniqueCode
      };
      
      const savedQuiz = await storage.createQuiz(quizWithCode);
      res.status(201).json(savedQuiz);
    } catch (error) {
      console.error('Error creating quiz:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });
  
  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const creatorName = req.body.creatorName;
      
      if (!creatorName) {
        return res.status(400).json({ message: "Creator name is required" });
      }
      
      await storage.deleteQuiz(quizId, creatorName);
      res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ message: error.message || "Failed to delete quiz" });
    }
  });
  
  app.get("/api/quizzes/:id/attempts", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const attempts = await storage.getQuizAttempts(quizId);
      res.json(attempts);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });
  
  app.get("/api/quizzes/:id/my-attempt", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const userName = req.query.userName as string;
      
      if (!userName) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const attempt = await storage.getUserAttemptForQuiz(quizId, userName);
      
      if (!attempt) {
        return res.status(404).json(null);
      }
      
      res.json(attempt);
    } catch (error) {
      console.error('Error fetching user quiz attempt:', error);
      res.status(500).json({ message: "Failed to fetch quiz attempt" });
    }
  });
  
  app.post("/api/quizzes/attempts", async (req, res) => {
    try {
      const attemptData = req.body;
      
      // Validate with Zod
      const validAttempt = quizAttemptSchema.parse(attemptData);
      
      // Get the quiz to check answers
      const quiz = await storage.getQuizById(validAttempt.quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Calculate score
      let score = 0;
      const answers: QuizAnswer[] = [];
      
      validAttempt.answers.forEach(userAnswer => {
        const question = quiz.questions.find(q => q.id === userAnswer.questionId);
        
        if (!question) return;
        
        const isCorrect = Array.isArray(question.correctAnswer)
          ? Array.isArray(userAnswer.answer)
            ? JSON.stringify(userAnswer.answer.sort()) === JSON.stringify(question.correctAnswer.sort())
            : false
          : userAnswer.answer === question.correctAnswer;
        
        if (isCorrect) score++;
        
        answers.push({
          questionId: userAnswer.questionId,
          answer: userAnswer.answer,
          isCorrect
        });
      });
      
      const attemptToSave = {
        quizId: validAttempt.quizId,
        userName: validAttempt.userName,
        score,
        totalQuestions: quiz.questions.length,
        answers
      };
      
      const savedAttempt = await storage.createQuizAttempt(attemptToSave);
      res.status(201).json(savedAttempt);
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: "Failed to submit quiz answers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import express from "express";
