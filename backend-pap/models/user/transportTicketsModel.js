const db = require("../../db");
const crypto = require("crypto");

/**
 * Compute SHA-256 hash of a buffer.
 * @param {Buffer} buffer
 * @returns {string} hex string
 */
function computeFileHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Check if a ticket is a duplicate before saving.
 * Two rules:
 *   1. Same ticket number used by anyone (numero_bilhete is globally unique)
 *   2. Same file uploaded twice by the same user (user_id + file_hash)
 *
 * @param {number} userId
 * @param {string|null} numeroBilhete
 * @param {string} fileHash
 * @returns {Promise<{ isDuplicate: boolean, reason: string|null }>}
 */
async function checkDuplicate(userId, numeroBilhete, fileHash) {
  // Check by ticket number first (global)
  if (numeroBilhete) {
    const [rows] = await db.query(
      "SELECT id FROM transport_tickets WHERE numero_bilhete = ? LIMIT 1",
      [numeroBilhete]
    );
    if (rows.length > 0) {
      return {
        isDuplicate: true,
        reason: `Este bilhete (${numeroBilhete}) já foi utilizado para completar uma missão.`,
      };
    }
  }

  // Check by file hash per user
  const [hashRows] = await db.query(
    "SELECT id FROM transport_tickets WHERE user_id = ? AND file_hash = ? LIMIT 1",
    [userId, fileHash]
  );
  if (hashRows.length > 0) {
    return {
      isDuplicate: true,
      reason: "Este ficheiro já foi submetido anteriormente.",
    };
  }

  return { isDuplicate: false, reason: null };
}

/**
 * Save a validated transport ticket record.
 *
 * @param {object} data
 * @param {number}      data.userId
 * @param {number|null} data.missionId
 * @param {string|null} data.numeroBilhete
 * @param {string}      data.fileHash
 * @param {string|null} data.empresa
 * @param {string|null} data.origem
 * @param {string|null} data.destino
 * @param {string|null} data.dataViagem   - ISO date string or DD/MM/YYYY
 * @param {string|null} data.horaViagem   - HH:MM or HH:MM:SS
 * @param {number|null} data.preco
 * @returns {Promise<number>} inserted id
 */
async function saveTicket({ userId, missionId, numeroBilhete, fileHash, empresa, origem, destino, dataViagem, horaViagem, preco }) {
  // Normalise date to YYYY-MM-DD for MySQL DATE column
  let dataFormatted = null;
  if (dataViagem) {
    const dmyMatch = String(dataViagem).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      const fullYear = y.length === 2 ? "20" + y : y;
      dataFormatted = `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    } else {
      dataFormatted = dataViagem;
    }
  }

  const [result] = await db.query(
    `INSERT INTO transport_tickets
       (user_id, mission_id, numero_bilhete, file_hash, empresa, origem, destino, data_viagem, hora_viagem, preco)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      missionId || null,
      numeroBilhete || null,
      fileHash,
      empresa || null,
      origem || null,
      destino || null,
      dataFormatted,
      horaViagem || null,
      preco != null ? Number(preco) : null,
    ]
  );

  return result.insertId;
}

module.exports = { computeFileHash, checkDuplicate, saveTicket };
