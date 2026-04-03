const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require("../../controllers/user/profileController");
const { auth } = require("../../authMiddleware");

router.use(auth);

// Obter perfil do usuário logado
router.get("/", getProfile);

// Atualizar perfil do usuário
router.put("/", updateProfile);

// Alterar senha
router.post("/change-password", changePassword);

module.exports = router;
