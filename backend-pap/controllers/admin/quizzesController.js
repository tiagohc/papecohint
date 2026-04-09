const { createQuiz, getAllQuizzes, getQuizById, updateQuiz, deleteQuiz } = require("../../models/admin/quizzesModel");

// CRIAR QUIZ
async function createQuizCtrl(req, res) {
  const { title, description, topic } = req.body;
  if (!title || !topic) return res.status(400).json({ error: "Dados em falta" });

  try {
    const quiz = await createQuiz({ title, description, topic });
    res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// LISTAR TODOS OS QUIZZES
async function getQuizzes(req, res) {
  try {
    const quizzes = await getAllQuizzes();
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// OBTER UM QUIZ
async function getQuiz(req, res) {
  const { id } = req.params;
  try {
    const quiz = await getQuizById(id);
    if (!quiz) return res.status(404).json({ error: "Quiz não encontrado" });
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ATUALIZAR QUIZ
async function updateQuizCtrl(req, res) {
  const { id } = req.params;
  const { title, description, topic } = req.body;
  if (!title || !topic) return res.status(400).json({ error: "Dados em falta" });

  try {
    const quiz = await updateQuiz(id, { title, description, topic });
    if (!quiz) return res.status(404).json({ error: "Quiz não encontrado" });
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// DELETAR QUIZ
async function deleteQuizCtrl(req, res) {
  const { id } = req.params;
  try {
    const deleted = await deleteQuiz(id);
    if (!deleted) return res.status(404).json({ error: "Quiz não encontrado" });
    res.json({ message: "Quiz deletado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { createQuizCtrl, getQuizzes, getQuiz, updateQuizCtrl, deleteQuizCtrl };
