const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auth } = require("../middlewares/auth");

// Get all answers for a question
router.get("/question/:questionId", async (req, res) => {
  const { questionId } = req.params;
  const answers = await prisma.answer.findMany({
    where: { questionId: Number(questionId) }
  });
  res.json(answers);
});

// Create an answer (teacher)
router.post("/", auth("teacher"), async (req, res) => {
  const { questionId, text, isCorrect } = req.body;
  try {
    const answer = await prisma.answer.create({
      data: { questionId, text, isCorrect }
    });
    res.json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
