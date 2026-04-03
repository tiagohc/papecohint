const { getUserNotifications: getNotificationsFromDB, getUserNotificationById, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } = require("../../models/user/notificationsModel");

// LISTAR NOTIFICAÇÕES DO USUÁRIO
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await getNotificationsFromDB(userId);

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar notificações" });
  }
}

// OBTER UMA NOTIFICAÇÃO
async function getUserNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await getUserNotificationById(id, userId);

    if (!notification) return res.status(404).json({ error: "Notificação não encontrada" });

    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter notificação" });
  }
}

// MARCAR NOTIFICAÇÃO COMO LIDA
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const marked = await markNotificationAsRead(id, userId);

    if (!marked) return res.status(404).json({ error: "Notificação não encontrada" });

    res.json({ message: "Notificação marcada como lida" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao marcar notificação" });
  }
}

// MARCAR TODAS COMO LIDAS
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await markAllNotificationsAsRead(userId);

    res.json({ message: "Todas as notificações marcadas como lidas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao marcar notificações" });
  }
}

module.exports = {
  getUserNotifications,
  getUserNotification,
  markAsRead,
  markAllAsRead,
};
