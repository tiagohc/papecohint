const db = require("../../db");

// Criar fatura/invoice
async function createInvoice({ user_id, amount, status, description }) {
  const [result] = await db.query(
    "INSERT INTO invoices (user_id, amount, status, description) VALUES (?, ?, ?, ?)",
    [user_id, amount, status || "pending", description || ""]
  );

  return await getInvoiceById(result.insertId);
}

// Listar todas as faturas
async function getAllInvoices() {
  const [invoices] = await db.query(
    `SELECT i.id, i.user_id, u.name AS user_name, u.email, i.amount, 
            i.status, i.description, i.created_at, i.updated_at
     FROM invoices i
     LEFT JOIN users u ON i.user_id = u.id
     ORDER BY i.created_at DESC`
  );
  return invoices;
}

// Obter fatura por ID
async function getInvoiceById(invoiceId) {
  const [invoices] = await db.query(
    `SELECT i.id, i.user_id, u.name AS user_name, u.email, i.amount,
            i.status, i.description, i.created_at, i.updated_at
     FROM invoices i
     LEFT JOIN users u ON i.user_id = u.id
     WHERE i.id = ?`,
    [invoiceId]
  );
  return invoices.length > 0 ? invoices[0] : null;
}

// Listar faturas por usuário
async function getInvoicesByUserId(userId) {
  const [invoices] = await db.query(
    "SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return invoices;
}

// Atualizar fatura
async function updateInvoice(invoiceId, { amount, status, description }) {
  const [result] = await db.query(
    "UPDATE invoices SET amount = ?, status = ?, description = ? WHERE id = ?",
    [amount, status, description || "", invoiceId]
  );

  return result.affectedRows > 0 ? await getInvoiceById(invoiceId) : null;
}

// Deletar fatura
async function deleteInvoice(invoiceId) {
  const [result] = await db.query("DELETE FROM invoices WHERE id = ?", [invoiceId]);
  return result.affectedRows > 0;
}

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByUserId,
  updateInvoice,
  deleteInvoice,
};
