const express = require("express");
const router = express.Router();
const { getUserNotifications, getUserNotification, markAsRead, markAllAsRead, registerToken, unregisterToken } = require("../../controllers/user/notificationsController");
const { auth } = require("../../authMiddleware");

router.use(auth);

// Contagem de notificações não lidas
router.get("/unread-count", async (req, res) => {
  try {
    const { getUnreadCount } = require("../../models/user/notificationsModel");
    const count = await getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
});

// Listar todas as notificações do usuário
router.get("/", getUserNotifications);

// Registar FCM token
router.post("/register-token", registerToken);

// Remover FCM token
router.delete("/unregister-token", unregisterToken);

// Marcar todas como lidas
router.put("/read-all", markAllAsRead);

// Obter uma notificação específica
router.get("/:id", getUserNotification);

// Marcar uma notificação como lida
router.put("/:id/read", markAsRead);

module.exports = router;
