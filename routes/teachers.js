const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { auth } = require("../middlewares/auth");

// Signup teacher
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, photo } = req.body;
    const hashed = await hashPassword(password);
    const teacher = await prisma.teacher.create({ data: { name, email, password: hashed, photo } });
    const token = jwt.sign({ id: teacher.id, role: "teacher" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: teacher.id, name: teacher.name, email: teacher.email, photo: teacher.photo, role: "teacher" } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login teacher
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await comparePassword(password, teacher.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: teacher.id, role: "teacher" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: teacher.id, name: teacher.name, email: teacher.email, photo: teacher.photo, role: "teacher" } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Create course
router.post("/courses", auth("teacher"), async (req, res) => {
  const teacherId = req.user.id;
  const { name, description, imageUrl } = req.body;
  try {
    const course = await prisma.course.create({ data: { name, description, imageUrl, teacherId } });
    res.json(course);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List my courses
router.get("/courses", auth("teacher"), async (req, res) => {
  const teacherId = req.user.id;
  const courses = await prisma.course.findMany({ where: { teacherId }, include: { videos: true, notes: true, quizzes: true } });
  res.json(courses);
});

module.exports = router;


