const express = require("express");
const router = express.Router();
const { getUserNotifications, getUserNotification, markAsRead, markAllAsRead } = require("../../controllers/user/notificationsController");
const { auth } = require("../../authMiddleware");

router.use(auth);

// Listar todas as notificações do usuário
router.get("/", getUserNotifications);

// Obter uma notificação específica
router.get("/:id", getUserNotification);

// Marcar uma notificação como lida
router.put("/:id/read", markAsRead);

// Marcar todas como lidas
router.put("/read-all", markAllAsRead);

module.exports = router;
