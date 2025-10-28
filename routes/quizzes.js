const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auth } = require("../middlewares/auth");

// Get all quizzes for a course
router.get("/course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const quizzes = await prisma.quiz.findMany({
    where: { courseId: Number(courseId) },
    include: { questions: true }
  });
  res.json(quizzes);
});

// Get a single quiz with questions
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: Number(id) },
    include: { questions: { include: { answers: true } } }
  });
  res.json(quiz);
});

// Create a new quiz (teacher only)
router.post("/", auth("teacher"), async (req, res) => {
  const { courseId, title, totalMarks, timeLimit } = req.body;
  try {
    const quiz = await prisma.quiz.create({
      data: { courseId, title, totalMarks, timeLimit }
    });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start quiz attempt (student)
router.post("/:quizId/start", auth("student"), async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user.id;
  try {
    const attempt = await prisma.userQuiz.upsert({
      where: { studentId_quizId: { studentId, quizId: Number(quizId) } },
      update: { status: "Pending", startedAt: new Date() },
      create: { studentId, quizId: Number(quizId), status: "Pending", startedAt: new Date() }
    });
    res.json(attempt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Submit quiz attempt with answers and auto-score
router.post("/:quizId/submit", auth("student"), async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user.id;
  const { answers } = req.body; // [{ questionId, answerId }]
  try {
    const questions = await prisma.question.findMany({
      where: { quizId: Number(quizId) },
      include: { answers: true }
    });
    let score = 0;
    for (const q of questions) {
      const provided = answers.find(a => a.questionId === q.id);
      if (!provided) continue;
      const correct = q.answers.find(a => a.isCorrect);
      if (correct && correct.id === provided.answerId) score += q.marks;
    }
    const finished = await prisma.userQuiz.update({
      where: { studentId_quizId: { studentId, quizId: Number(quizId) } },
      data: { status: "Completed", score, finishedAt: new Date() }
    });
    res.json(finished);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
