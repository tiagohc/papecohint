const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { getProfileById, updateProfile: updateProfileModel, updateAvatar, getPasswordByUserId, updatePassword } = require("../../models/user/profileModel");

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/avatars");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
}).single("avatar");

// Recebe um ficheiro de imagem, guarda em disco e actualiza avatar_url na BD
async function uploadAvatarHandler(req, res) {
  avatarUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    try {
      await updateAvatar(userId, avatarUrl);
      res.json({ avatar_url: avatarUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao guardar avatar" });
    }
  });
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
