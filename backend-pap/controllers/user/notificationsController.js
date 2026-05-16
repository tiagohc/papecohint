const { getUserNotifications: getNotificationsFromDB, getUserNotificationById, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, registerFcmToken, unregisterFcmToken, updateFcmLang } = require("../../models/user/notificationsModel");

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

// REGISTAR FCM TOKEN
async function registerToken(req, res) {
  try {
    const userId = req.user.id;
    const { token, lang } = req.body;
    if (!token) return res.status(400).json({ error: "Token em falta" });

    await registerFcmToken(userId, token, lang);
    res.json({ message: "Token registado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registar token" });
  }
}

// REMOVER FCM TOKEN
async function unregisterToken(req, res) {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token em falta" });

    await unregisterFcmToken(userId, token);
    res.json({ message: "Token removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover token" });
  }
}

// ACTUALIZAR IDIOMA DOS TOKENS FCM + perfil do utilizador
async function updateLang(req, res) {
  try {
    const userId = req.user.id;
    const { lang } = req.body;
    if (!["pt", "en"].includes(lang)) return res.status(400).json({ error: "Idioma inválido" });
    // Guardar idioma no perfil do utilizador
    const db = require("../../db");
    await db.query("UPDATE users SET language = ? WHERE id = ?", [lang, userId]);
    // Actualizar FCM tokens (falha silenciosa se tabela não existir)
    await updateFcmLang(userId, lang).catch(() => {});
    res.json({ message: "Idioma actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao actualizar idioma" });
  }
}

module.exports = {
  getUserNotifications,
  getUserNotification,
  markAsRead,
  markAllAsRead,
  registerToken,
  unregisterToken,
  updateLang,
};
