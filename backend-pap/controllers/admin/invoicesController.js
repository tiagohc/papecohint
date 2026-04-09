const {
  createInvoice: createInvoiceDB,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByUserId,
  updateInvoice: updateInvoiceDB,
  deleteInvoice: deleteInvoiceDB,
} = require("../../models/admin/invoicesModel");

// ============================
// LISTAR TODAS AS FATURAS
// ============================
async function getInvoices(req, res) {
  try {
    const invoices = await getAllInvoices();
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar faturas" });
  }
}

// ============================
// OBTER FATURA POR ID
// ============================
async function getInvoice(req, res) {
  const { id } = req.params;
  try {
    const invoice = await getInvoiceById(id);
    if (!invoice) return res.status(404).json({ error: "Fatura não encontrada" });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter fatura" });
  }
}

// ============================
// FATURAS POR UTILIZADOR
// ============================
async function getInvoicesByUser(req, res) {
  const { userId } = req.params;
  try {
    const invoices = await getInvoicesByUserId(userId);
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar faturas do utilizador" });
  }
}

// ============================
// CRIAR FATURA
// ============================
async function createInvoice(req, res) {
  const { user_id, amount, status, description } = req.body;

  if (!user_id || amount === undefined) {
    return res.status(400).json({ error: "user_id e amount são obrigatórios" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  const validStatuses = ["pending", "paid", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  try {
    const invoice = await createInvoiceDB({ user_id, amount: parsedAmount, status, description });
    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar fatura" });
  }
}

// ============================
// ATUALIZAR FATURA
// ============================
async function updateInvoice(req, res) {
  const { id } = req.params;
  const { amount, status, description } = req.body;

  if (amount !== undefined) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: "Valor inválido" });
  }

  const validStatuses = ["pending", "paid", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  try {
    const invoice = await updateInvoiceDB(id, { amount, status, description });
    if (!invoice) return res.status(404).json({ error: "Fatura não encontrada" });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar fatura" });
  }
}

// ============================
// ELIMINAR FATURA
// ============================
async function deleteInvoice(req, res) {
  const { id } = req.params;
  try {
    const deleted = await deleteInvoiceDB(id);
    if (!deleted) return res.status(404).json({ error: "Fatura não encontrada" });
    res.json({ message: "Fatura eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao eliminar fatura" });
  }
}

module.exports = {
  getInvoices,
  getInvoice,
  getInvoicesByUser,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
