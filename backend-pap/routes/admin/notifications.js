const express = require("express");
const router = express.Router();
const { getNotifications, sendToAll, sendToUser, deleteNotif } = require("../../controllers/admin/notificationsController");
const { auth, adminOnly } = require("../../authMiddleware");

router.use(auth);

// LISTAR TODAS AS NOTIFICAÇÕES (ADMIN)
router.get("/", adminOnly, getNotifications);

// ENVIAR PARA TODOS
router.post("/send-all", adminOnly, sendToAll);

// ENVIAR PARA USUÁRIO ESPECÍFICO
router.post("/send/:userId", adminOnly, sendToUser);

// DELETAR NOTIFICAÇÃO
router.delete("/:id", adminOnly, deleteNotif);

module.exports = router;