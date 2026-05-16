const bcrypt = require("bcryptjs");
const { getProfileById, updateProfile: updateProfileModel, updateAvatar, getPasswordByUserId, updatePassword } = require("../../models/user/profileModel");
const { validatePassword } = require("../../utils/passwordValidator");

// Recebe base64 data URI e guarda directamente na BD (sem ficheiro em disco)
async function uploadAvatarHandler(req, res) {
  const { base64 } = req.body;
  if (!base64 || typeof base64 !== "string") {
    return res.status(400).json({ error: "Imagem não fornecida" });
  }
  if (!base64.startsWith("data:image/")) {
    return res.status(400).json({ error: "Formato inválido" });
  }
  // Limit ~2MB base64
  if (Buffer.byteLength(base64, "utf8") > 2 * 1024 * 1024) {
    return res.status(400).json({ error: "Imagem demasiado grande (máx 2MB)" });
  }
  try {
    await updateAvatar(req.user.id, base64);
    res.json({ avatar_url: base64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao guardar avatar" });
  }
}

// Devolve o perfil completo do utilizador autenticado
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

// Actualiza o nome do utilizador e devolve o perfil actualizado
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

    const updated = await updateProfileModel(userId, { name });

    if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });

    const user = await getProfileById(userId);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
}

// Valida a senha actual e substitui pela nova (bcrypt)
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

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
  uploadAvatarHandler,
  changePassword,
};
