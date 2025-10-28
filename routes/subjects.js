const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auth } = require("../middlewares/auth");

// List all courses (public)
router.get("/", async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { quizzes: true, videos: true, notes: true, teacher: true }
  });
  res.json(courses);
});

// Enroll current student in course
router.post("/enroll", auth("student"), async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.body;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId }
    });
    res.json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
