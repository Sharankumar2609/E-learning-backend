const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Submit quiz answers and calculate score
router.post("/", auth("student"), async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;
    const studentId = req.user.id;

    // Get quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: {
        questions: {
          include: {
            answers: true
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Check if student already attempted this quiz
    const existingAttempt = await prisma.userQuiz.findFirst({
      where: {
        studentId: studentId,
        quizId: parseInt(quizId)
      }
    });

    if (existingAttempt) {
      return res.status(400).json({ error: "You have already attempted this quiz" });
    }

    // Calculate score
    let totalScore = 0;
    let correctAnswers = 0;
    let totalQuestions = quiz.questions.length;

    for (const question of quiz.questions) {
      const studentAnswerId = answers[question.id];
      if (studentAnswerId) {
        const selectedAnswer = question.answers.find(a => a.id === studentAnswerId);
        if (selectedAnswer && selectedAnswer.isCorrect) {
          totalScore += question.marks;
          correctAnswers++;
        }
      }
    }

    // Save quiz attempt
    const quizAttempt = await prisma.userQuiz.create({
      data: {
        studentId: studentId,
        quizId: parseInt(quizId),
        score: totalScore,
        timeSpent: timeSpent || 0,
        answers: JSON.stringify(answers)
      }
    });

    res.json({
      score: totalScore,
      totalMarks: quiz.totalMarks,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      timeSpent: timeSpent || 0,
      percentage: Math.round((totalScore / quiz.totalMarks) * 100)
    });

  } catch (error) {
    console.error("Quiz submission error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get student's quiz attempts
router.get("/student/:studentId", auth("student"), async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    // Verify the student is accessing their own data
    if (req.user.id !== studentId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const attempts = await prisma.userQuiz.findMany({
      where: { studentId: studentId },
      include: {
        quiz: {
          include: {
            course: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(attempts);
  } catch (error) {
    console.error("Get quiz attempts error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get quiz attempt details
router.get("/:attemptId", auth("student"), async (req, res) => {
  try {
    const attemptId = parseInt(req.params.attemptId);
    
    const attempt = await prisma.userQuiz.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: "Quiz attempt not found" });
    }

    // Verify the student is accessing their own attempt
    if (req.user.id !== attempt.studentId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(attempt);
  } catch (error) {
    console.error("Get quiz attempt error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
