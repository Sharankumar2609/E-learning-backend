const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { quizzes: true, videos: true },
    });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, subjectId } = req.body;
    const enrollment = await prisma.userSubject.create({
      data: { studentId, subjectId },
    });
    res.json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
