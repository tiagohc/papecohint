const db = require("../../db");

// Listar todas as notificações do usuário
async function getUserNotifications(userId) {
  const [notifications] = await db.query(
    `SELECT id, title, message, type, read_status, created_at 
     FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId]
  );
  return notifications;
}

// Obter uma notificação específica
async function getUserNotificationById(notificationId, userId) {
  const [notifications] = await db.query(
    "SELECT * FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
  return notifications.length > 0 ? notifications[0] : null;
}

// Marcar notificação como lida
async function markNotificationAsRead(notificationId, userId) {
  const [result] = await db.query(
    "UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

// Marcar todas as notificações como lidas
async function markAllNotificationsAsRead(userId) {
  const [result] = await db.query(
    "UPDATE notifications SET read_status = 1 WHERE user_id = ? AND read_status = 0",
    [userId]
  );
  return result.affectedRows > 0;
}

// Obter contagem de notificações não lidas
async function getUnreadCount(userId) {
  const [rows] = await db.query(
    "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND read_status = 0",
    [userId]
  );
  return rows.length > 0 ? rows[0].unread_count : 0;
}

// Criar notificação (usado por outras partes do sistema)
async function createNotification(userId, { title, message, type = "info" }) {
  const [result] = await db.query(
    "INSERT INTO notifications (user_id, title, message, type, read_status) VALUES (?, ?, ?, ?, 0)",
    [userId, title, message, type]
  );
  return result.insertId;
}

module.exports = {
  getUserNotifications,
  getUserNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  createNotification,
};
