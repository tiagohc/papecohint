const path = require("path");
const crypto = require("crypto");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");

// ──────────────────────────────────────────────
// Text extraction
// ──────────────────────────────────────────────

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return (data.text || "").trim();
  } catch {
    return "";
  }
}

async function extractTextFromImage(buffer) {
  try {
    // Pre-process: convert to greyscale PNG for better OCR accuracy
    const processed = await sharp(buffer)
      .greyscale()
      .normalize()
      .png()
      .toBuffer();

    const { data: { text } } = await Tesseract.recognize(processed, "por+eng", {
      langPath: path.join(__dirname, ".."),
      logger: () => {},
    });
    return (text || "").trim();
  } catch {
    return "";
  }
}

// ──────────────────────────────────────────────
// Regex extraction helpers
// ──────────────────────────────────────────────

// Normalize text: collapse whitespace, upper-case accented chars
function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractKwh(text) {
  // Patterns: "250 kWh", "250kWh", "250 KWH", "Consumo: 250", "Total: 250 kWh"
  const patterns = [
    /(\d[\d\s.,]*)\s*k[Ww][Hh]/gi,
    /[Cc]onsumo\s*:?\s*(\d[\d.,]*)\s*(?:k[Ww][Hh])?/i,
    /[Ee]nergia\s+[Aa]tiva\s*:?\s*(\d[\d.,]*)/i,
    /[Tt]otal\s+[Aa]tivo\s*:?\s*(\d[\d.,]*)/i,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const raw = match[1].replace(/\s/g, "").replace(",", ".");
      const value = parseFloat(raw);
      if (!isNaN(value) && value > 0 && value <= 50000) return value;
    }
  }
  return null;
}

function extractEntity(text) {
  const entities = [
    "EDA", "EDP", "Endesa", "Iberdrola", "Galp", "Goldenergy",
    "Repower", "Muon", "Coopernico", "Electra", "EREE",
  ];
  const upper = text.toUpperCase();
  for (const entity of entities) {
    if (upper.includes(entity.toUpperCase())) return entity;
  }
  return null;
}

function extractPeriod(text) {
  // Matches: "01/01/2024 a 31/01/2024", "01-01-2024 a 31-01-2024", "Jan 2024", "Janeiro 2024"
  const rangePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+[aA]\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/;
  const match = text.match(rangePattern);
  if (match) {
    return { start: parseDatePT(match[1]), end: parseDatePT(match[2]) };
  }

  // Fallback: single date reference (month/year)
  const monthYear = /(?:jan(?:eiro)?|feb?(?:ereiro)?|mar(?:ço)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\w*\s+(\d{4})/i;
  const my = text.match(monthYear);
  if (my) {
    const months = {
      jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
      jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
    };
    const prefix = my[0].substring(0, 3).toLowerCase();
    const month = months[prefix] || 1;
    const year = parseInt(my[1]);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start: toDateString(start), end: toDateString(end) };
  }

  return { start: null, end: null };
}

function parseDatePT(str) {
  const parts = str.split(/[\/\-]/);
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toDateString(date) {
  return date.toISOString().split("T")[0];
}

function extractName(text) {
  // Look for lines after keywords: "Cliente:", "Nome:", "Titular:", "Exmo(a). Sr(a)."
  const patterns = [
    /(?:[Cc]liente|[Nn]ome|[Tt]itular)\s*:?\s*([A-ZÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ][A-Za-záéíóúãõâêîôûàèìòùçÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ ]{3,60})/,
    /Exmo?\(a?\)\.\s*Sr\(?a?\)?\.\s*([A-ZÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ][A-Za-záéíóúãõâêîôûàèìòùçÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ ]{3,60})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// ──────────────────────────────────────────────
// Main extraction
// ──────────────────────────────────────────────

function extractInvoiceData(text) {
  const normalized = normalizeText(text);
  return {
    kwh: extractKwh(normalized),
    entity: extractEntity(normalized),
    name: extractName(normalized),
    ...extractPeriod(normalized),
  };
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

function validateInvoice(extracted) {
  const errors = [];
  if (!extracted.entity) errors.push("Entidade não encontrada. Apenas faturas da EDA (Electricidade dos Açores) são aceites.");
  if (extracted.entity && extracted.entity.toUpperCase() !== "EDA") {
    errors.push(`Apenas faturas da EDA são aceites para esta missão. Entidade detetada: ${extracted.entity}`);
  }
  if (!extracted.kwh)    errors.push("Consumo em kWh não encontrado na fatura");
  if (!extracted.name)   errors.push("Nome do titular não encontrado na fatura");
  if (!extracted.start && !extracted.end) errors.push("Período de faturação não encontrado");
  if (extracted.kwh && extracted.kwh > 50000) errors.push("Valor de kWh absurdo");
  return { valid: errors.length === 0, errors };
}

// ──────────────────────────────────────────────
// Confidence score
// ──────────────────────────────────────────────

function computeConfidence(extracted, userName, aliases = []) {
  let score = 0;

  // Name match
  if (extracted.name) {
    const normalizedDetected = normalizeName(extracted.name);
    const namesToCheck = [userName, ...aliases].map(normalizeName);
    const nameMatched = namesToCheck.some((n) => {
      // partial match: any word of user name appears in invoice name or vice-versa
      const detectedWords = normalizedDetected.split(" ").filter(Boolean);
      const userWords = n.split(" ").filter(Boolean);
      return userWords.some((w) => w.length > 2 && detectedWords.includes(w));
    });
    if (nameMatched) score += 50;
  }

  if (extracted.entity) score += 20;
  if (extracted.kwh)    score += 15;
  if (extracted.start || extracted.end) score += 15;

  return score; // max 100
}

// ──────────────────────────────────────────────
// Deduplication
// ──────────────────────────────────────────────

function computeFileHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ──────────────────────────────────────────────
// Determine text extraction method from mime/ext
// ──────────────────────────────────────────────

async function extractText(buffer, mimeType, originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  const isPDF = mimeType === "application/pdf" || ext === ".pdf";
  if (isPDF) return extractTextFromPDF(buffer);
  return extractTextFromImage(buffer);
}

module.exports = {
  extractText,
  extractInvoiceData,
  validateInvoice,
  computeConfidence,
  computeFileHash,
  normalizeName,
};
