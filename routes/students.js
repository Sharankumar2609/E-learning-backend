const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { auth } = require("../middlewares/auth");

// Get all students
router.get("/", async (req, res) => {
  const students = await prisma.student.findMany({
    include: { enrollments: true, quizAttempts: true, videoProgress: true }
  });
  res.json(students);
});

// Get a single student
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({
    where: { id: Number(id) },
    include: { enrollments: true, quizAttempts: true, videoProgress: true }
  });
  res.json(student);
});

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, photo } = req.body;
    const hashed = await hashPassword(password);
    const student = await prisma.student.create({ data: { name, email, password: hashed, photo } });
    const token = jwt.sign({ id: student.id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: student.id, name: student.name, email: student.email, photo: student.photo, role: "student" } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await comparePassword(password, student.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: student.id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: student.id, name: student.name, email: student.email, photo: student.photo, role: "student" } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Dashboard metrics for current user
router.get("/me/metrics", auth("student"), async (req, res) => {
  const studentId = req.user.id;
  const enrollments = await prisma.enrollment.findMany({ where: { studentId }, include: { course: { include: { videos: true, quizzes: true } } } });
  const numCourses = enrollments.length;
  const totalVideos = enrollments.reduce((acc, e) => acc + e.course.videos.length, 0);
  const completedQuizzes = await prisma.userQuiz.count({ where: { studentId, status: "Completed" } });
  const pendingQuizzes = await prisma.userQuiz.count({ where: { studentId, status: "Pending" } });
  res.json({ numCourses, totalVideos, completedQuizzes, pendingQuizzes });
});

// Enrolled courses for current user
router.get("/me/courses", auth("student"), async (req, res) => {
  const studentId = req.user.id;
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { course: { include: { videos: true, notes: true, quizzes: true } } }
  });
  res.json(enrollments.map(e => e.course));
});

module.exports = router;
