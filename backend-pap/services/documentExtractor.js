/**
 * documentExtractor.js
 * Extracts text from a PDF buffer using pdf-parse.
 * Falls back to Tesseract OCR if extracted text is too short.
 */

const pdfParse = require("pdf-parse");

// Lazy-load tesseract only when needed (heavy module)
async function ocrBuffer(buffer) {
  const sharp = require("sharp");
  const Tesseract = require("tesseract.js");

  // Convert buffer to greyscale PNG for better OCR
  const processed = await sharp(buffer).greyscale().png().toBuffer();
  const { data } = await Tesseract.recognize(processed, "por+eng", {
    logger: () => {},
  });
  return data.text || "";
}

/**
 * Extract text from a PDF or image buffer.
 * @param {Buffer} buffer
 * @param {string} mimeType - e.g. "application/pdf" or "image/jpeg"
 * @returns {Promise<string>}
 */
async function extractText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    try {
      const data = await pdfParse(buffer);
      const text = (data.text || "").trim();
      // If PDF has meaningful text, use it
      if (text.length > 50) return text;
      // Otherwise the PDF is likely image-based — try OCR on first page
      console.log("[extractor] PDF text too short, falling back to OCR");
    } catch (e) {
      console.warn("[extractor] pdf-parse failed:", e.message);
    }
    // Attempt OCR on the raw buffer (may not work well for multi-page PDFs,
    // but covers image-only PDFs)
    return ocrBuffer(buffer);
  }

  // For images, go straight to OCR
  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/bmp"];
  if (imageTypes.includes(mimeType)) {
    return ocrBuffer(buffer);
  }

  throw new Error(`Tipo de ficheiro não suportado: ${mimeType}`);
}

module.exports = { extractText };
