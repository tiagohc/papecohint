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

// Ensure fcm_tokens has a lang column (runs once, silently if already exists)
async function ensureLangColumn() {
  try {
    await db.query(`ALTER TABLE fcm_tokens ADD COLUMN lang CHAR(2) NOT NULL DEFAULT 'pt'`);
  } catch (err) {
    // Column already exists — ignore
  }
}
ensureLangColumn();

// Registar FCM token
async function registerFcmToken(userId, token, lang = 'pt') {
  const safeLang = lang === 'en' ? 'en' : 'pt';
  await db.query(
    `INSERT INTO fcm_tokens (user_id, token, lang) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE lang = VALUES(lang), created_at = CURRENT_TIMESTAMP`,
    [userId, token, safeLang]
  );
}

// Remover FCM token
async function unregisterFcmToken(userId, token) {
  await db.query(
    "DELETE FROM fcm_tokens WHERE user_id = ? AND token = ?",
    [userId, token]
  );
}

// Actualizar idioma de todos os tokens FCM do utilizador
async function updateFcmLang(userId, lang) {
  const safeLang = lang === 'en' ? 'en' : 'pt';
  await db.query(
    "UPDATE fcm_tokens SET lang = ? WHERE user_id = ?",
    [safeLang, userId]
  );
}

module.exports = {
  getUserNotifications,
  getUserNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  createNotification,
  registerFcmToken,
  unregisterFcmToken,
  updateFcmLang,
};
