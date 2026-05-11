/**
 * documentAnalyzer.js
 * Orchestrates the full pipeline:
 * 1. Extract text (pdf-parse or OCR)
 * 2. Ask OpenAI to extract structured data
 * 3. Run code-based validations
 * 4. Ask OpenAI to flag inconsistencies / possible fraud
 */

const { extractText } = require("./documentExtractor");
const { chatCompletion } = require("./openaiClient");
const { validateInvoice, validateTicket } = require("../utils/documentValidator");

// ─── Prompts ─────────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT_INVOICE = `
Analisa o texto seguinte de uma fatura e extrai os dados estruturados.
Responde APENAS com JSON válido, sem markdown, sem explicações.

Estrutura obrigatória:
{
  "tipo": "fatura",
  "nome_empresa": "...",
  "nif": "...",
  "data": "dd/mm/yyyy",
  "total": 0.00,
  "iva": 0.00,
  "lista_itens": [
    { "descricao": "...", "quantidade": 1, "preco": 0.00 }
  ]
}

Se um campo não existir no documento, usa null.
Texto do documento:
`;

const EXTRACTION_PROMPT_TICKET = `
Analisa o texto seguinte de um bilhete de transporte (autocarro, comboio, barco, etc.) e extrai os dados estruturados.
Responde APENAS com JSON válido, sem markdown, sem explicações.

Estrutura obrigatória:
{
  "tipo": "bilhete",
  "origem": "...",
  "destino": "...",
  "data": "dd/mm/yyyy",
  "hora": "HH:MM",
  "preco": 0.00,
  "empresa": "...",
  "numero_bilhete": "...",
  "passageiro": "..."
}

Notas importantes:
- A empresa Mobiazores (também escrita "Mobi Açores" ou "MOBIAZORES") é uma transportadora dos Açores (Portugal).
- Extrai a empresa exactamente como aparece no documento.
- Se um campo não existir, usa null.
Texto do documento:
`;

const FRAUD_ANALYSIS_PROMPT = `
Analisa o seguinte texto extraído de um documento.
Identifica possíveis inconsistências, erros suspeitos, indícios de fraude ou manipulação.

Responde APENAS com JSON válido, sem markdown:
{
  "suspeito": true/false,
  "nivel_risco": "baixo" | "medio" | "alto",
  "observacoes": ["observação 1", "observação 2"]
}

Critérios a verificar:
- Valores ilógicos ou exagerados
- Datas impossíveis ou suspeitas
- Erros ortográficos em nomes de empresas conhecidas
- Formatação inconsistente
- Campos duplicados com valores diferentes
- Totais que não batem certo

Texto do documento:
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectDocumentType(text) {
  const lower = text.toLowerCase();
  const invoiceKeywords = ["fatura", "invoice", "nif", "iva", "subtotal", "total a pagar", "nota de débito"];
  const ticketKeywords = ["bilhete", "ticket", "partida", "chegada", "passageiro", "comboio", "autocarro", "cp ", "flixbus", "rede expressos", "mobiazores", "mobi açores", "mobi azores", "horario", "horário", "linha", "paragem"];

  const invoiceScore = invoiceKeywords.filter((k) => lower.includes(k)).length;
  const ticketScore = ticketKeywords.filter((k) => lower.includes(k)).length;

  if (ticketScore > invoiceScore) return "bilhete";
  return "fatura"; // default
}

function safeParseJson(raw) {
  if (!raw) return null;
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Analyse a document buffer.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @param {string} [forcedType] - "fatura" | "bilhete" | undefined (auto-detect)
 * @returns {Promise<AnalysisResult>}
 */
async function analyzeDocument(buffer, mimeType, forcedType) {
  // ── Step 1: Extract text ──────────────────────────────────────────────────
  console.log("[analyzer] Extracting text...");
  const text = await extractText(buffer, mimeType);

  if (!text || text.trim().length < 20) {
    return {
      sucesso: false,
      erro: "Não foi possível extrair texto do documento. Certifica-te de que o ficheiro não está corrompido ou protegido por password.",
      sugestao: "Envia um PDF com texto seleccionável ou uma imagem nítida do documento.",
    };
  }

  // ── Step 2: Detect type ───────────────────────────────────────────────────
  const docType = forcedType || detectDocumentType(text);
  console.log("[analyzer] Document type:", docType);

  // ── Step 3: Extract structured data via OpenAI ────────────────────────────
  const extractionPrompt = docType === "bilhete"
    ? EXTRACTION_PROMPT_TICKET
    : EXTRACTION_PROMPT_INVOICE;

  let dadosExtraidos = null;
  let extractionError = null;

  try {
    const raw = await chatCompletion(
      [{ role: "user", content: extractionPrompt + "\n\n" + text.slice(0, 8000) }],
      { jsonMode: true, maxTokens: 800, temperature: 0.1 }
    );
    dadosExtraidos = safeParseJson(raw);
    if (!dadosExtraidos) extractionError = "Não foi possível interpretar a resposta da IA.";
  } catch (e) {
    extractionError = e.message;
  }

  // ── Step 4: Code-based validation ─────────────────────────────────────────
  let validacoes = { ok: true, erros: [] };
  if (dadosExtraidos) {
    const errors = docType === "bilhete"
      ? validateTicket(dadosExtraidos)
      : validateInvoice(dadosExtraidos);
    validacoes = { ok: errors.length === 0, erros: errors };
  }

  // ── Step 5: AI fraud analysis ─────────────────────────────────────────────
  let analiseAI = null;
  let fraudError = null;

  try {
    const raw = await chatCompletion(
      [{ role: "user", content: FRAUD_ANALYSIS_PROMPT + "\n\n" + text.slice(0, 8000) }],
      { jsonMode: true, maxTokens: 400, temperature: 0.1 }
    );
    analiseAI = safeParseJson(raw);
    if (!analiseAI) fraudError = "Não foi possível interpretar a análise de fraude.";
  } catch (e) {
    fraudError = e.message;
  }

  // ── Build response ────────────────────────────────────────────────────────
  return {
    sucesso: true,
    tipo_documento: docType,
    dados_extraidos: dadosExtraidos,
    extraction_error: extractionError || undefined,
    validacoes,
    analise_ai: analiseAI,
    fraud_analysis_error: fraudError || undefined,
    // User-facing action message
    acao_necessaria: buildActionMessage(validacoes, analiseAI),
  };
}

function buildActionMessage(validacoes, analiseAI) {
  const messages = [];

  if (!validacoes.ok && validacoes.erros.length > 0) {
    messages.push(
      `⚠️ O documento tem ${validacoes.erros.length} problema(s) de validação:\n` +
        validacoes.erros.map((e) => `  • ${e}`).join("\n")
    );
    messages.push("👉 Corrige os erros acima antes de submeter este documento.");
  }

  if (analiseAI?.suspeito) {
    const nivel = analiseAI.nivel_risco || "desconhecido";
    messages.push(`🚨 A IA detectou indícios de irregularidade (risco: ${nivel}).`);
    if (analiseAI.observacoes?.length) {
      messages.push("Observações:\n" + analiseAI.observacoes.map((o) => `  • ${o}`).join("\n"));
    }
    messages.push("👉 Este documento será enviado para revisão manual pelo administrador.");
  }

  if (messages.length === 0) {
    messages.push("✅ Documento validado com sucesso. Nenhuma irregularidade detectada.");
  }

  return messages.join("\n\n");
}

// ─── Vision Analysis (images) ─────────────────────────────────────────────────

/**
 * Analyse a transport ticket IMAGE using GPT vision.
 * Returns a structure compatible with the rest of the mission completion flow.
 *
 * @param {Buffer} buffer
 * @param {string} mimeType  - e.g. "image/jpeg"
 * @param {object} mission   - mission row (type, created_at, expires_at)
 * @returns {Promise<object>}
 */
async function analyzeTicketWithVision(buffer, mimeType, mission) {
  // Calculate deadline in days from mission type
  let deadlineDays = 1;
  if (mission) {
    if (mission.type === "monthly") deadlineDays = 30;
    else deadlineDays = 1;
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const minDate = new Date(Date.now() - deadlineDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Known identifiers for authentic Mobiazores tickets
  const MOBI_NAMES = ["mobi azores", "mobiazores", "mobi açores", "mobi azores, lda", "mobi azores lda"];
  const MOBI_NIF = "517752859";

  const systemPrompt = `És um sistema automático de validação de tickets de transporte para a aplicação EcoHint.
O teu único objetivo é verificar se uma imagem contém um bilhete REAL e VÁLIDO da empresa Mobiazores (NIF: ${MOBI_NIF}).

PRINCÍPIO FUNDAMENTAL: Em caso de dúvida → valido = false. Nunca approves por aproximação.

Critérios de autenticidade que DEVEM estar presentes:
- O nome da empresa deve ser visível: "MOBI AZORES", "Mobi Azores", "MOBIAZORES", "Mobi Açores" ou similar.
- O NIF ${MOBI_NIF} é um sinal forte de autenticidade — se estiver presente, confirma a empresa.
- Deve ter campos típicos: Data, Origem, Destino, número de bilhete ou compra, e total/preço.
- A imagem deve ser legível e parecer um recibo/ticket impresso real.

Motivos para imagem_valida = false:
- Imagem de fundo branco genérico, screenshot de ecrã duvidosa, imagem borrada ou ilegível.
- Não contém estrutura de bilhete (sem origem, destino, data, empresa).

Motivos para empresa_valida = false:
- Nome da empresa não é Mobiazores ou variante reconhecida.
- A empresa é outra (ex: CP, Rede Expressos, Carris, etc.).
- Não aparece nome de empresa nenhum.

Motivos para dentro_prazo = false:
- Data do ticket anterior a ${minDate}.
- Data do ticket posterior a ${today} (data futura — suspeito).
- Não foi possível extrair a data.`;

  const userPrompt = `Analisa esta imagem de bilhete de transporte. Data atual: ${today}.

Para ser válido o bilhete DEVE ter:
1. Nome da empresa visível: "MOBI AZORES", "Mobiazores" ou variante.
2. Data entre ${minDate} e ${today}.
3. Ser claramente um recibo/bilhete impresso real (não uma foto de outra coisa).

Se a imagem não for um bilhete da Mobiazores → empresa_valida=false, valido=false.
Se não tiver data legível → dentro_prazo=false, valido=false.
Se for uma foto de qualquer outra coisa → imagem_valida=false, valido=false.

Responde APENAS com este JSON (substitui os valores conforme a análise):
{
  "empresa_valida": false,
  "data_ticket": null,
  "dentro_prazo": false,
  "imagem_valida": false,
  "valido": false,
  "motivo": "descreve o problema em português"
}

"valido" só pode ser true se os 3 critérios acima forem todos verdadeiros.`;

  const base64 = buffer.toString("base64");

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
        },
      ],
    },
  ];

  let visionResult = null;
  try {
    const raw = await chatCompletion(messages, {
      model: "gpt-4o",
      jsonMode: true,
      maxTokens: 500,
      temperature: 0,
      timeoutMs: 45000,
    });
    console.log("[vision] Raw AI response:", raw);
    visionResult = safeParseJson(raw);
    console.log("[vision] Parsed result:", JSON.stringify(visionResult));
  } catch (e) {
    console.error("[vision] OpenAI error:", e.message);
    return {
      sucesso: false,
      erro: "Erro ao analisar a imagem com IA. Tenta novamente.",
      isVision: true,
    };
  }

  if (!visionResult) {
    return {
      sucesso: false,
      erro: "A IA não conseguiu interpretar a imagem. Envia uma imagem mais nítida.",
      isVision: true,
    };
  }

  // Use the "valido" field as the single source of truth
  const valido = visionResult.valido === true;

  // Hard override: if the AI says valido=true but empresa_valida=false or dentro_prazo=false,
  // force valido=false — the AI must be consistent or we block.
  const hardValido = valido
    && visionResult.empresa_valida === true
    && visionResult.dentro_prazo === true
    && visionResult.imagem_valida === true;

  // Build detailed error list for the user
  const erros = [];
  if (!visionResult.imagem_valida) {
    erros.push(visionResult.motivo || "A imagem não parece ser um bilhete válido ou está ilegível.");
  } else if (!visionResult.empresa_valida) {
    erros.push(visionResult.motivo || "O bilhete não pertence à empresa Mobiazores.");
  } else if (!visionResult.dentro_prazo) {
    erros.push(visionResult.motivo || `O bilhete está fora do prazo da missão (${deadlineDays} dia(s)).`);
  } else if (!hardValido) {
    erros.push(visionResult.motivo || "O bilhete não passou na validação automática.");
  }

  // Always block if image is invalid or any required field is false
  if (!visionResult.imagem_valida || !hardValido) {
    // If image is outright bad, return hard failure
    if (!visionResult.imagem_valida) {
      return {
        sucesso: false,
        erro: erros[0],
        isVision: true,
      };
    }
  }

  return {
    sucesso: true,
    isVision: true,
    dados_extraidos: {
      tipo: "bilhete",
      empresa: visionResult.empresa_valida ? "Mobiazores" : null,
      data: visionResult.data_ticket || null,
      empresa_valida: visionResult.empresa_valida,
      dentro_prazo: visionResult.dentro_prazo,
      valido: hardValido,
    },
    validacoes: {
      ok: hardValido,
      erros,
    },
    analise_ai: {
      suspeito: !hardValido,
      nivel_risco: !hardValido ? "medio" : "baixo",
      observacoes: visionResult.motivo ? [visionResult.motivo] : [],
    },
  };
}

module.exports = { analyzeDocument, analyzeTicketWithVision };
