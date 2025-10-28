const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auth } = require("../middlewares/auth");

// Get notes for a course
router.get("/course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const notes = await prisma.note.findMany({ where: { courseId: Number(courseId) } });
  res.json(notes);
});

// Create note (teacher)
router.post("/", auth("teacher"), async (req, res) => {
  const { courseId, title, url, type } = req.body; // type: 'PDF' | 'PPT'
  try {
    const note = await prisma.note.create({ data: { courseId, title, url, type } });
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;


