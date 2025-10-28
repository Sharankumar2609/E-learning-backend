const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { enrollments: true, quizAttempts: true, videoProgress: true },
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, photo } = req.body;
    const student = await prisma.student.create({
      data: { name, email, password, photo },
    });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
