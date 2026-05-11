/**
 * documentController.js
 * Handles POST /user/documents/analyze
 */

const fs = require("fs");
const multer = require("multer");
const { analyzeDocument } = require("../../services/documentAnalyzer");

// Store to disk temporarily so we can delete after processing
const upload = multer({
  dest: require("path").join(__dirname, "../../uploads/documents/"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/tiff",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Tipo de ficheiro não suportado: ${file.mimetype}. ` +
            "Aceites: PDF, JPG, PNG, WEBP, TIFF."
        )
      );
    }
  },
}).single("document");

async function analyzeDocumentHandler(req, res) {
  // Run multer manually so we can handle its errors cleanly
  await new Promise((resolve, reject) => {
    upload(req, res, (err) => (err ? reject(err) : resolve()));
  }).catch((err) => {
    return res.status(400).json({
      sucesso: false,
      erro: err.message,
      sugestao:
        "Envia um ficheiro PDF ou imagem (JPG, PNG, WEBP, TIFF) com tamanho máximo de 20 MB.",
    });
  });

  if (res.headersSent) return;

  if (!req.file) {
    return res.status(400).json({
      sucesso: false,
      erro: "Nenhum ficheiro enviado.",
      sugestao:
        'Envia o ficheiro no campo "document" do formulário (multipart/form-data).',
    });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;
  const forcedType = req.body.tipo || undefined; // "fatura" | "bilhete" | undefined

  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (e) {
    return res.status(500).json({ sucesso: false, erro: "Erro ao ler ficheiro." });
  } finally {
    // Always delete temp file
    try { fs.unlinkSync(filePath); } catch (_) {}
  }

  // Check OPENAI_API_KEY early so we give a clear message
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      sucesso: false,
      erro: "Serviço de análise por IA não configurado.",
      sugestao:
        "O administrador precisa de adicionar OPENAI_API_KEY ao ficheiro .env do servidor e reiniciar o backend.",
    });
  }

  try {
    console.log(`[documents] Analyzing ${mimeType} (${(buffer.length / 1024).toFixed(0)} KB)...`);
    const result = await analyzeDocument(buffer, mimeType, forcedType);
    const status = result.sucesso ? 200 : 422;
    return res.status(status).json(result);
  } catch (err) {
    console.error("[documents] Unexpected error:", err);

    // Give a friendly message based on known error types
    if (err.message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({
        sucesso: false,
        erro: "Chave da OpenAI inválida ou em falta.",
        sugestao:
          "O administrador deve verificar a variável OPENAI_API_KEY no .env e reiniciar o servidor.",
      });
    }

    if (err.message?.includes("Timeout")) {
      return res.status(504).json({
        sucesso: false,
        erro: "A análise demorou demasiado tempo.",
        sugestao: "Tenta novamente. Se persistir, o documento pode ser demasiado complexo.",
      });
    }

    return res.status(500).json({
      sucesso: false,
      erro: "Erro interno ao analisar o documento.",
      sugestao: "Tenta novamente ou contacta o suporte.",
    });
  }
}

module.exports = { analyzeDocumentHandler };
