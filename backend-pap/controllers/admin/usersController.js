const bcrypt = require("bcryptjs");
const { createUser: createUserModel, getAllUsers, getUserById, getUserByEmail, updateUser: updateUserModel, deleteUser: deleteUserModel } = require("../../models/admin/usersModel");

// CRIAR USUÁRIO
async function createUser(req, res) {
  const { name, email, password, role = "user", status = "active" } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Dados em falta" });

  try {
    // Verificar se email já existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) return res.status(409).json({ error: "Email já existe" });

    const user = await createUserModel({ name, email, password, role, status });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// LISTAR TODOS USUÁRIOS
async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// OBTER UM USUÁRIO
async function getUser(req, res) {
  const { id } = req.params;
  try {
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ATUALIZAR USUÁRIO
async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  if (!name || !email || !role || !status) return res.status(400).json({ error: "Dados em falta" });

  try {
    // Verificar se email já existe (se foi alterado)
    const currentUser = await getUserById(id);
    if (!currentUser) return res.status(404).json({ error: "Usuário não encontrado" });

    if (currentUser.email !== email) {
      const existingUser = await getUserByEmail(email);
      if (existingUser) return res.status(409).json({ error: "Email já existe" });
    }

    const user = await updateUserModel(id, { name, email, role, status });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// DELETAR USUÁRIO
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    const deleted = await deleteUserModel(id);
    if (!deleted) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ message: "Usuário deletado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { createUser, getUsers, getUser, updateUser, deleteUser };
