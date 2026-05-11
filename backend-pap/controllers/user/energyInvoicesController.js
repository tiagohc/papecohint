const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  extractText,
  extractInvoiceData,
  validateInvoice,
  computeConfidence,
  computeFileHash,
} = require("../../services/invoiceProcessor");
const {
  createEnergyInvoice,
  getUserEnergyInvoices,
  isDuplicateInvoice,
  isPeriodOverlapping,
  confirmEnergyInvoice,
  rejectEnergyInvoice,
  getLastConfirmedKwh,
  getUserAliases,
  createAlias,
  deleteAlias,
} = require("../../models/user/energyInvoicesModel");
const { checkAndCompleteInvoiceMissions } = require("../../models/user/missionsModel");
const db = require("../../db");

// ──────────────────────────────────────────────
// Multer config — memory storage (process buffer before saving)
// ──────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/tiff",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de ficheiro não suportado. Usa PDF ou imagem (JPEG, PNG, WEBP, TIFF)."));
    }
  },
}).single("invoice");

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "invoices");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ──────────────────────────────────────────────
// POST /user/energy-invoices/upload
// ──────────────────────────────────────────────

async function uploadInvoice(req, res) {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Ficheiro demasiado grande (máximo 10 MB)" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum ficheiro enviado" });
    }

    const userId = req.user.id;
    const buffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;

    // Deduplication check
    const fileHash = computeFileHash(buffer);
    const duplicate = await isDuplicateInvoice(userId, fileHash);
    if (duplicate) {
      return res.status(409).json({ error: "Esta fatura já foi submetida anteriormente" });
    }

    // Extract text
    const rawText = await extractText(buffer, mimeType, originalName);
    if (!rawText) {
      return res.status(422).json({ error: "Não foi possível ler o conteúdo do ficheiro" });
    }

    // Extract structured data
    const extracted = extractInvoiceData(rawText);

    // Validate
    const { valid, errors } = validateInvoice(extracted);
    if (!valid) {
      return res.status(422).json({
        error: "Fatura inválida ou incompleta",
        details: errors,
      });
    }

    // Get user name + aliases for confidence
    const [userRows] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
    const userName = userRows[0]?.name || "";
    const aliases = await getUserAliases(userId);
    const aliasNames = aliases.map((a) => a.name);

    // Compute confidence
    const confidence = computeConfidence(extracted, userName, aliasNames);

    if (confidence < 30) {
      return res.status(422).json({
        error: "Nome na fatura não coincide com a tua conta nem com os teus titulares associados",
        details: [`Nome detetado: ${extracted.name || "nenhum"}`],
        name_detected: extracted.name,
        confidence,
      });
    }

    // Save file to disk
    const safeFileName = `${userId}_${Date.now()}_${fileHash.substring(0, 8)}${path.extname(originalName)}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, buffer);
    const relativeFilePath = `uploads/invoices/${safeFileName}`;

    // Create DB record (status: pending_confirmation)
    const invoice = await createEnergyInvoice({
      userId,
      nameDetected: extracted.name,
      kwh: extracted.kwh,
      periodStart: extracted.start,
      periodEnd: extracted.end,
      entity: extracted.entity,
      confidence,
      filePath: relativeFilePath,
      fileHash,
      rawText,
    });

    res.status(201).json({
      invoice,
      confidence_label: confidenceLabel(confidence),
    });
  });
}

// ──────────────────────────────────────────────
// POST /user/energy-invoices/:id/confirm
// ──────────────────────────────────────────────

async function confirmInvoice(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const confirmed = await confirmEnergyInvoice(id, userId);
  if (!confirmed) {
    return res.status(404).json({ error: "Fatura não encontrada ou já processada" });
  }

  // Period overlap check (warn only — don't block, already confirmed)
  const overlap = await isPeriodOverlapping(userId, confirmed.period_start, confirmed.period_end);
  const previousKwh = await getLastConfirmedKwh(userId, confirmed.id);

  // Auto-complete invoice missions (pass billing period for date validation)
  const missionsResult = await checkAndCompleteInvoiceMissions(
    userId,
    confirmed.kwh,
    previousKwh,
    confirmed.period_start,
    confirmed.period_end
  );

  res.json({
    invoice: confirmed,
    overlap_warning: overlap ? "Já tens uma fatura confirmada para este período" : null,
    missions_completed: missionsResult.completed,
    points_awarded: missionsResult.pointsAwarded,
  });
}

// ──────────────────────────────────────────────
// DELETE /user/energy-invoices/:id
// ──────────────────────────────────────────────

async function rejectInvoice(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const deleted = await rejectEnergyInvoice(id, userId);
  if (!deleted) {
    return res.status(404).json({ error: "Fatura não encontrada" });
  }
  res.json({ message: "Fatura rejeitada" });
}

// ──────────────────────────────────────────────
// GET /user/energy-invoices
// ──────────────────────────────────────────────

async function listInvoices(req, res) {
  const userId = req.user.id;
  const invoices = await getUserEnergyInvoices(userId);
  res.json(invoices);
}

// ──────────────────────────────────────────────
// GET /user/aliases
// ──────────────────────────────────────────────

async function listAliases(req, res) {
  const userId = req.user.id;
  const aliases = await getUserAliases(userId);
  res.json(aliases);
}

// ──────────────────────────────────────────────
// POST /user/aliases
// ──────────────────────────────────────────────

async function addAlias(req, res) {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  if (name.trim().length < 2 || name.trim().length > 255) {
    return res.status(400).json({ error: "Nome inválido" });
  }
  try {
    const alias = await createAlias(userId, name.trim());
    res.status(201).json(alias);
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Este nome já está associado à tua conta" });
    }
    console.error(err);
    res.status(500).json({ error: "Erro ao adicionar nome" });
  }
}

// ──────────────────────────────────────────────
// DELETE /user/aliases/:id
// ──────────────────────────────────────────────

async function removeAlias(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const deleted = await deleteAlias(id, userId);
  if (!deleted) {
    return res.status(404).json({ error: "Alias não encontrado" });
  }
  res.json({ message: "Alias removido" });
}

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function confidenceLabel(score) {
  if (score >= 70) return "alto";
  if (score >= 40) return "médio";
  return "baixo";
}

module.exports = {
  uploadInvoice,
  confirmInvoice,
  rejectInvoice,
  listInvoices,
  listAliases,
  addAlias,
  removeAlias,
};
