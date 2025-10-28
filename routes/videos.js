const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auth } = require("../middlewares/auth");

// Get all videos for a course
router.get("/course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const videos = await prisma.video.findMany({
    where: { courseId: Number(courseId) }
  });
  res.json(videos);
});

// Create a video (teacher)
router.post("/", auth("teacher"), async (req, res) => {
  const { courseId, title, url } = req.body;
  try {
    const video = await prisma.video.create({ data: { courseId, title, url } });
    res.json(video);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update video progress (student)
router.post("/progress", auth("student"), async (req, res) => {
  const studentId = req.user.id;
  const { videoId, status } = req.body;
  try {
    const progress = await prisma.userVideo.upsert({
      where: { studentId_videoId: { studentId, videoId } },
      update: { status, watchedAt: new Date() },
      create: { studentId, videoId, status, watchedAt: new Date() }
    });
    res.json(progress);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
