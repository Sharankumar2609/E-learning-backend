const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 2000;

app.use(cors());
app.use(express.json());

// Routes
const studentRoutes = require("./routes/students");
const subjectRoutes = require("./routes/subjects");
const quizRoutes = require("./routes/quizzes");
const videoRoutes = require("./routes/videos");
const teacherRoutes = require("./routes/teachers");
const noteRoutes = require("./routes/notes");
const blobRoutes = require("./routes/blob");
const questionRoutes = require("./routes/questions");
const answerRoutes = require("./routes/answers");
const userQuizRoutes = require("./routes/UserQuiz");

app.use("/api/students", studentRoutes);
app.use("/api/courses", subjectRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/blob", blobRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/user-quizzes", userQuizRoutes);
app.get("/api/test", (req, res) => {
  res.send("Backend is connected and working!");
});
app.get("/", (req, res) => {
  res.send("Backend is running successfully on Azure 🚀");
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
