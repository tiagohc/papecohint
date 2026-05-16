const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  getUserMissions: getMissionsFromDB,
  getUserMissionById,
  completeMissionDirect,
  isMissingTableError,
  getUserMissionsHistory,
} = require("../../models/user/missionsModel");
const { getPremiumStatus } = require("../../models/user/premiumModel");
const { analyzeDocument, analyzeTicketWithVision } = require("../../services/documentAnalyzer");
const { validateTicketForMission } = require("../../utils/documentValidator");
const { computeFileHash, checkDuplicate, saveTicket } = require("../../models/user/transportTicketsModel");

// Multer for ticket uploads — accepts PDF and common image formats
const TICKET_ACCEPTED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const ticketUpload = multer({
  dest: path.join(__dirname, "../../uploads/documents/"),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (TICKET_ACCEPTED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Ficheiro não suportado. Envia o bilhete em PDF, JPG ou PNG."));
  },
}).single("document");

const ACCEPTED_IMAGE_MIMES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/heic", "image/heif", "image/tiff",
];

/**
 * Basic local validation: checks the photo is a real image data URL.
 * No API key needed. Blocks PDFs, text files, tiny test images, etc.
 */
function validatePhotoLocally(photoUrl) {
  if (!photoUrl || typeof photoUrl !== "string") {
    return "Foto em falta ou formato inválido.";
  }
  const match = photoUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) {
    return "Formato inválido. Envia uma imagem (JPG, PNG ou WEBP).";
  }
  const mime = match[1].toLowerCase();
  const base64 = match[2];

  if (!ACCEPTED_IMAGE_MIMES.includes(mime)) {
    return `Tipo de ficheiro não aceite (${mime}). Envia uma imagem JPG, PNG ou WEBP — não um PDF ou outro documento.`;
  }

  // Estimate file size: base64 encodes 3 bytes per 4 chars
  const estimatedBytes = Math.floor((base64.length * 3) / 4);
  if (estimatedBytes < 5 * 1024) {
    // Less than 5 KB is almost certainly a test/placeholder image
    return "A imagem é demasiado pequena para ser um documento válido. Envia uma fotografia real.";
  }

  return null; // valid
}

// LISTAR MISSÕES DO USUÁRIO
async function getUserMissions(req, res) {
  try {
    const userId = req.user.id;
    const lang = (req.query.lang || req.headers['accept-language'] || 'pt').startsWith('en') ? 'en' : 'pt';

    let isPremium = false;
    try {
      const status = await getPremiumStatus(userId);
      isPremium = status?.status === "active";
    } catch (_) {
      // tabela user_premium pode não existir — tratar como não premium
    }

    const missions = await getMissionsFromDB(userId, isPremium, lang);

    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar missões" });
  }
}

// OBTER DETALHES DE UMA MISSÃO
async function getUserMission(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mission = await getUserMissionById(id, userId);

    if (!mission) return res.status(404).json({ error: "Missão não encontrada" });

    res.json(mission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter missão" });
  }
}

// COMPLETAR MISSÃO (sem confirmação manual)
async function completeUserMission(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "Foto é obrigatória" });
    }

    // Local validation — no API key needed
    const photoError = validatePhotoLocally(photoUrl);
    if (photoError) {
      return res.status(422).json({ error: photoError });
    }

    const mission = await getUserMissionById(id, userId);
    if (!mission) return res.status(404).json({ error: "Missão não encontrada" });

    if (mission.verification_type === "transport_ticket") {
      return res.status(400).json({ error: "Esta missão requer um bilhete PDF de transporte. Usa o botão 'Submeter Bilhete'." });
    }

    const result = await completeMissionDirect(id, userId, photoUrl);
    if (result.alreadyCompleted) {
      return res.status(400).json({ error: "Missão já foi completada" });
    }
    if (result.missionUnavailable) {
      return res.status(404).json({ error: "Missão indisponível ou expirada" });
    }

    res.status(201).json({ message: "Missão completada com sucesso", points_awarded: result.points });
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) {
      return res.status(503).json({
        error: "Tabela user_missions não existe. Execute a migração da base de dados.",
      });
    }
    res.status(500).json({ error: "Erro ao completar missão" });
  }
}

// Endpoint mantido por compatibilidade; resgate manual desativado
async function redeemUserMission(req, res) {
  res.status(400).json({
    error: "Resgate manual desativado. Os pontos são atribuídos ao completar a missão.",
  });
}

// COMPLETAR MISSÃO DE TRANSPORTE COM VERIFICAÇÃO DE BILHETE POR IA
async function completeWithTicket(req, res) {
  // Handle file upload
  const uploadErr = await new Promise((resolve) => {
    ticketUpload(req, res, (err) => resolve(err || null));
  });

  if (uploadErr) {
    return res.status(400).json({ error: uploadErr.message });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Nenhum ficheiro enviado. Envia o bilhete no campo \"document\"." });
  }

  if (!process.env.OPENAI_API_KEY) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(503).json({ error: "Serviço de análise por IA não configurado. Contacta o administrador." });
  }

  const { id } = req.params;
  const userId = req.user.id;

  // Read buffer and delete temp file
  let buffer;
  try {
    buffer = fs.readFileSync(req.file.path);
  } catch (readErr) {
    console.error("[missions/complete] Erro ao ler ficheiro:", readErr.message);
    return res.status(500).json({ error: "Erro ao processar o ficheiro. Tenta novamente." });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
  }

  // Get mission info
  const mission = await getUserMissionById(id, userId).catch(() => null);
  if (!mission) {
    return res.status(404).json({ error: "Missão não encontrada ou expirada." });
  }
  if (mission.isCompleted) {
    return res.status(400).json({ error: "Esta missão já foi completada." });
  }

  // Run AI analysis — use vision for images, document pipeline for PDFs
  let analysis;
  try {
    const isImage = req.file.mimetype.startsWith("image/");
    if (isImage) {
      analysis = await analyzeTicketWithVision(buffer, req.file.mimetype, mission);
    } else {
      analysis = await analyzeDocument(buffer, req.file.mimetype, "bilhete");
    }
  } catch (err) {
    console.error("[missions/complete] AI analysis error:", err.message);
    return res.status(500).json({ error: "Erro ao analisar o bilhete. Tenta novamente." });
  }

  if (!analysis.sucesso) {
    return res.status(422).json({
      error: analysis.erro || "Não foi possível ler o documento.",
      sugestao: analysis.sugestao,
    });
  }

  // Validate ticket against mission period and company
  // (skip for vision — AI already validated empresa + prazo)
  if (!analysis.isVision) {
    const ticketErrors = validateTicketForMission(analysis.dados_extraidos, mission);
    if (ticketErrors.length > 0) {
      return res.status(422).json({
        error: "O bilhete não é válido para esta missão.",
        detalhes: ticketErrors,
        dados_extraidos: analysis.dados_extraidos,
      });
    }
  } else if (!analysis.validacoes.ok) {
    return res.status(422).json({
      error: "O bilhete não é válido para esta missão.",
      detalhes: analysis.validacoes.erros,
      dados_extraidos: analysis.dados_extraidos,
    });
  }

  // AI fraud check
  if (analysis.analise_ai?.suspeito && analysis.analise_ai?.nivel_risco === "alto") {
    return res.status(422).json({
      error: "A IA detetou indícios de irregularidade neste bilhete.",
      detalhes: analysis.analise_ai.observacoes || [],
    });
  }

  // Deduplication check
  const fileHash = computeFileHash(buffer);
  const numeroBilhete = analysis.dados_extraidos?.numero_bilhete || null;
  const dupCheck = await checkDuplicate(userId, numeroBilhete, fileHash).catch(() => ({ isDuplicate: false, reason: null }));
  if (dupCheck.isDuplicate) {
    return res.status(422).json({ error: dupCheck.reason || "Este bilhete já foi utilizado." });
  }

  // Complete the mission
  try {
    const photoPlaceholder = `ticket_ai_verified:${analysis.dados_extraidos?.empresa || "transport"}:${analysis.dados_extraidos?.data || ""}`;
    const result = await completeMissionDirect(id, userId, photoPlaceholder);

    if (result.alreadyCompleted) {
      return res.status(400).json({ error: "Missão já foi completada." });
    }
    if (result.missionUnavailable) {
      return res.status(404).json({ error: "Missão indisponível ou expirada." });
    }

    // Persist ticket record for history and future dedup
    await saveTicket({
      userId,
      missionId: Number(id),
      numeroBilhete,
      fileHash,
      empresa: analysis.dados_extraidos?.empresa || null,
      origem: analysis.dados_extraidos?.origem || null,
      destino: analysis.dados_extraidos?.destino || null,
      dataViagem: analysis.dados_extraidos?.data || null,
      horaViagem: analysis.dados_extraidos?.hora || null,
      preco: analysis.dados_extraidos?.preco || null,
    }).catch((saveErr) => {
      // Non-fatal: log but don't block the response
      console.error("[missions] Failed to save ticket record:", saveErr.message);
    });

    return res.status(201).json({
      message: "Missão de transporte completada com sucesso!",
      points_awarded: result.points,
      bilhete: {
        empresa: analysis.dados_extraidos?.empresa,
        data: analysis.dados_extraidos?.data,
        origem: analysis.dados_extraidos?.origem,
        destino: analysis.dados_extraidos?.destino,
      },
      aviso_ia: analysis.analise_ai?.suspeito
        ? `Nível de risco: ${analysis.analise_ai.nivel_risco}. Documento marcado para revisão.`
        : undefined,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registar conclusão da missão." });
  }
}

// PREVIEW DE BILHETE — analisa sem completar a missão
// Retorna os dados extraídos para o user confirmar antes de submeter
async function previewTicket(req, res) {
  const uploadErr = await new Promise((resolve) => {
    ticketUpload(req, res, (err) => resolve(err || null));
  });

  if (uploadErr) {
    return res.status(400).json({ error: uploadErr.message });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum ficheiro enviado. Envia o bilhete no campo "document".' });
  }

  if (!process.env.OPENAI_API_KEY) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(503).json({ error: "Serviço de análise por IA não configurado. Contacta o administrador." });
  }

  const { id } = req.params;
  const userId = req.user.id;

  let buffer;
  try {
    buffer = fs.readFileSync(req.file.path);
  } catch (readErr) {
    console.error("[missions/preview] Erro ao ler ficheiro:", readErr.message);
    return res.status(500).json({ error: "Erro ao processar o ficheiro. Tenta novamente." });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
  }

  const mission = await getUserMissionById(id, userId).catch(() => null);
  if (!mission) {
    return res.status(404).json({ error: "Missão não encontrada ou expirada." });
  }
  if (mission.isCompleted) {
    return res.status(400).json({ error: "Esta missão já foi completada." });
  }

  let analysis;
  try {
    const isImage = req.file.mimetype.startsWith("image/");
    if (isImage) {
      analysis = await analyzeTicketWithVision(buffer, req.file.mimetype, mission);
    } else {
      analysis = await analyzeDocument(buffer, req.file.mimetype, "bilhete");
    }
  } catch (err) {
    console.error("[missions/preview] AI analysis error:", err.message);
    return res.status(500).json({ error: "Erro ao analisar o bilhete. Tenta novamente." });
  }

  if (!analysis.sucesso) {
    return res.status(422).json({
      error: analysis.erro || "Não foi possível ler o documento.",
      sugestao: analysis.sugestao,
    });
  }

  // For vision, errors already computed; for PDF, run validateTicketForMission
  const ticketErrors = analysis.isVision
    ? analysis.validacoes.erros
    : validateTicketForMission(analysis.dados_extraidos, mission);

  // Dedup check (preview — informational only, not blocking unless it would definitely fail)
  const fileHash = computeFileHash(buffer);
  const numeroBilhete = analysis.dados_extraidos?.numero_bilhete || null;
  const dupCheck = await checkDuplicate(userId, numeroBilhete, fileHash).catch(() => ({ isDuplicate: false, reason: null }));
  if (dupCheck.isDuplicate) {
    return res.status(422).json({ error: dupCheck.reason || "Este bilhete já foi utilizado." });
  }

  return res.json({
    dados_extraidos: analysis.dados_extraidos,
    erros: ticketErrors,
    aviso_ia: analysis.analise_ai?.suspeito
      ? { nivel_risco: analysis.analise_ai.nivel_risco, observacoes: analysis.analise_ai.observacoes }
      : null,
    pode_confirmar: ticketErrors.length === 0 && !(analysis.analise_ai?.suspeito && analysis.analise_ai?.nivel_risco === "alto"),
  });
}

// HISTÓRICO DE MISSÕES DO UTILIZADOR (expiradas)
async function getMissionsHistory(req, res) {
  try {
    const userId = req.user.id;
    const lang = (req.query.lang || req.headers['accept-language'] || 'pt').startsWith('en') ? 'en' : 'pt';
    const history = await getUserMissionsHistory(userId, lang);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter histórico de missões" });
  }
}

module.exports = {
  getUserMissions,
  getUserMission,
  completeUserMission,
  redeemUserMission,
  completeWithTicket,
  previewTicket,
  getMissionsHistory,
};
