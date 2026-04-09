const express = require("express");
const router = express.Router();
const { createQuizCtrl, getQuizzes, getQuiz, updateQuizCtrl, deleteQuizCtrl } = require("../../controllers/admin/quizzesController");
const { auth, adminOnly } = require("../../authMiddleware");

router.use(auth);

// CRUD de quizzes (somente admin)
router.post("/", adminOnly, createQuizCtrl);
router.get("/", adminOnly, getQuizzes);
router.get("/:id", adminOnly, getQuiz);
router.put("/:id", adminOnly, updateQuizCtrl);
router.delete("/:id", adminOnly, deleteQuizCtrl);

module.exports = router;
