const db = require("../../db");

async function createEnergyInvoice({ userId, nameDetected, kwh, periodStart, periodEnd, entity, confidence, filePath, fileHash, rawText }) {
  const [result] = await db.query(
    `INSERT INTO energy_invoices
       (user_id, name_detected, kwh, period_start, period_end, entity, confidence, file_path, file_hash, status, raw_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', ?)`,
    [userId, nameDetected || null, kwh || null, periodStart || null, periodEnd || null,
     entity || null, confidence, filePath || null, fileHash, rawText || null]
  );
  return getEnergyInvoiceById(result.insertId);
}

async function getEnergyInvoiceById(id) {
  const [rows] = await db.query(
    "SELECT * FROM energy_invoices WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

async function getUserEnergyInvoices(userId) {
  const [rows] = await db.query(
    `SELECT id, name_detected, kwh, period_start, period_end, entity,
            confidence, file_path, status, created_at, confirmed_at
     FROM energy_invoices
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function isDuplicateInvoice(userId, fileHash) {
  const [rows] = await db.query(
    "SELECT id FROM energy_invoices WHERE user_id = ? AND file_hash = ?",
    [userId, fileHash]
  );
  return rows.length > 0;
}

async function isPeriodOverlapping(userId, periodStart, periodEnd) {
  if (!periodStart || !periodEnd) return false;
  const [rows] = await db.query(
    `SELECT id FROM energy_invoices
     WHERE user_id = ? AND status = 'confirmed'
       AND period_start IS NOT NULL AND period_end IS NOT NULL
       AND period_start <= ? AND period_end >= ?`,
    [userId, periodEnd, periodStart]
  );
  return rows.length > 0;
}

async function confirmEnergyInvoice(id, userId) {
  const [result] = await db.query(
    `UPDATE energy_invoices
     SET status = 'confirmed', confirmed_at = NOW()
     WHERE id = ? AND user_id = ? AND status = 'pending_confirmation'`,
    [id, userId]
  );
  if (result.affectedRows === 0) return null;
  return getEnergyInvoiceById(id);
}

async function rejectEnergyInvoice(id, userId) {
  const [result] = await db.query(
    "UPDATE energy_invoices SET status = 'rejected' WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function getLastConfirmedKwh(userId, excludeId) {
  const [rows] = await db.query(
    `SELECT kwh FROM energy_invoices
     WHERE user_id = ? AND status = 'confirmed' AND id != ? AND kwh IS NOT NULL
     ORDER BY confirmed_at DESC
     LIMIT 1`,
    [userId, excludeId]
  );
  return rows[0]?.kwh ?? null;
}

// ──────────────────────────────────────────────
// User aliases
// ──────────────────────────────────────────────

async function getUserAliases(userId) {
  const [rows] = await db.query(
    "SELECT id, name, created_at FROM user_aliases WHERE user_id = ? ORDER BY created_at ASC",
    [userId]
  );
  return rows;
}

async function createAlias(userId, name) {
  const [result] = await db.query(
    "INSERT INTO user_aliases (user_id, name) VALUES (?, ?)",
    [userId, name.trim()]
  );
  return { id: result.insertId, user_id: userId, name: name.trim() };
}

async function deleteAlias(id, userId) {
  const [result] = await db.query(
    "DELETE FROM user_aliases WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createEnergyInvoice,
  getEnergyInvoiceById,
  getUserEnergyInvoices,
  isDuplicateInvoice,
  isPeriodOverlapping,
  confirmEnergyInvoice,
  rejectEnergyInvoice,
  getLastConfirmedKwh,
  getUserAliases,
  createAlias,
  deleteAlias,
};
