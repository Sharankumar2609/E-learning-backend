const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auth } = require("../middlewares/auth");

// Get all questions for a quiz
router.get("/quiz/:quizId", async (req, res) => {
  const { quizId } = req.params;
  const questions = await prisma.question.findMany({
    where: { quizId: Number(quizId) },
    include: { answers: true }
  });
  res.json(questions);
});

// Create a question (teacher)
router.post("/", auth("teacher"), async (req, res) => {
  const { quizId, text, marks } = req.body;
  try {
    const question = await prisma.question.create({
      data: { quizId, text, marks }
    });
    res.json(question);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
