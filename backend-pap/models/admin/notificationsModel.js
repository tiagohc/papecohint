const db = require("../../db");
const { sendPushToUser, sendPushToAll } = require("../../services/pushNotificationService");

// Listar todas as notificações
async function getAllNotifications() {
  const [notifications] = await db.query(
    `SELECT n.id, n.user_id, u.name AS user_name, n.title, n.message, 
            n.type, n.read_status, n.created_at
     FROM notifications n
     LEFT JOIN users u ON n.user_id = u.id
     ORDER BY n.created_at DESC`
  );
  return notifications;
}

// Listar notificações por usuário
async function getNotificationsByUserId(userId) {
  const [notifications] = await db.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return notifications;
}

// Enviar notificação para todos os usuários
async function sendNotificationToAll({ title, message, type = "info" }) {
  const [users] = await db.query("SELECT id FROM users WHERE role = 'user'");

  for (const user of users) {
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [user.id, title, message, type]
    );
  }

  // Send push notification to all
  sendPushToAll(title, message, { type }).catch((err) =>
    console.error("Push broadcast error:", err.message)
  );

  return true;
}

// Enviar notificação para usuário específico
async function sendNotificationToUser(userId, { title, message, type = "info" }) {
  const [result] = await db.query(
    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
    [userId, title, message, type]
  );

  // Send push notification to user
  sendPushToUser(userId, title, message, { type }).catch((err) =>
    console.error("Push to user error:", err.message)
  );

  return result.insertId;
}

// Deletar notificação
async function deleteNotification(notificationId) {
  const [result] = await db.query("DELETE FROM notifications WHERE id = ?", [notificationId]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllNotifications,
  getNotificationsByUserId,
  sendNotificationToAll,
  sendNotificationToUser,
  deleteNotification,
};
