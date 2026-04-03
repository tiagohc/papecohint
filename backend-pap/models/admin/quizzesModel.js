const db = require("../../db");

// Criar quiz
async function createQuiz({ title, description, topic }) {
  const [result] = await db.query(
    "INSERT INTO quizzes (title, description, topic) VALUES (?, ?, ?)",
    [title, description || "", topic]
  );

  return await getQuizById(result.insertId);
}

// Listar todos os quizzes
async function getAllQuizzes() {
  const [quizzes] = await db.query(
    "SELECT id, title, description, topic, created_at FROM quizzes ORDER BY created_at DESC"
  );
  return quizzes;
}

// Obter quiz por ID
async function getQuizById(quizId) {
  const [quizzes] = await db.query(
    "SELECT * FROM quizzes WHERE id = ?",
    [quizId]
  );
  return quizzes.length > 0 ? quizzes[0] : null;
}

// Atualizar quiz
async function updateQuiz(quizId, { title, description, topic }) {
  const [result] = await db.query(
    "UPDATE quizzes SET title = ?, description = ?, topic = ? WHERE id = ?",
    [title, description || "", topic, quizId]
  );

  return result.affectedRows > 0 ? await getQuizById(quizId) : null;
}

// Deletar quiz
async function deleteQuiz(quizId) {
  const [result] = await db.query("DELETE FROM quizzes WHERE id = ?", [quizId]);
  return result.affectedRows > 0;
}

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
