const bcrypt = require("bcryptjs");
const { getProfileById, updateProfile: updateProfileModel, getPasswordByUserId, updatePassword } = require("../../models/user/profileModel");

// OBTER PERFIL DO USUÁRIO LOGADO
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const user = await getProfileById(userId);

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter perfil" });
  }
}

// ATUALIZAR PERFIL DO USUÁRIO
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, language } = req.body;

    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

    const updated = await updateProfileModel(userId, { name, language });

    if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });

    const user = await getProfileById(userId);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
}

// ALTERAR SENHA
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
    }

    const hashedPassword = await getPasswordByUserId(userId);

    if (!hashedPassword) return res.status(404).json({ error: "Usuário não encontrado" });

    const isPasswordValid = await bcrypt.compare(currentPassword, hashedPassword);

    if (!isPasswordValid) return res.status(401).json({ error: "Senha atual incorreta" });

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await updatePassword(userId, newHashedPassword);

    res.json({ message: "Senha alterada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
