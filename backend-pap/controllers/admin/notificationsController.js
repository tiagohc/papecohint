const { getAllNotifications, sendNotificationToAll, sendNotificationToUser, deleteNotification } = require("../../models/admin/notificationsModel");

// LISTAR TODAS AS NOTIFICAÇÕES (ADMIN)
async function getNotifications(req, res) {
  try {
    const notifications = await getAllNotifications();
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ENVIAR NOTIFICAÇÃO PARA TODOS OS USUÁRIOS
async function sendToAll(req, res) {
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Dados em falta" });

  try {
    await sendNotificationToAll({ title, message, type });
    res.status(201).json({ message: "Notificação enviada para todos os usuários" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ENVIAR NOTIFICAÇÃO PARA USUÁRIO ESPECÍFICO
async function sendToUser(req, res) {
  const { userId } = req.params;
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Dados em falta" });

  try {
    const id = await sendNotificationToUser(userId, { title, message, type });
    res.status(201).json({ id, message: "Notificação enviada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// DELETAR NOTIFICAÇÃO
async function deleteNotif(req, res) {
  const { id } = req.params;
  try {
    const deleted = await deleteNotification(id);
    if (!deleted) return res.status(404).json({ error: "Notificação não encontrada" });
    res.json({ message: "Notificação deletada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { getNotifications, sendToAll, sendToUser, deleteNotif };