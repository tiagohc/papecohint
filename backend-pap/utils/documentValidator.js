/**
 * documentValidator.js
 * Pure-code validation rules (no AI):
 *  - NIF format (Portugal)
 *  - Total vs sum of items
 *  - Dates not in the future
 *  - Required fields
 */

/**
 * Validate Portuguese NIF.
 * Rules: 9 digits, first digit in {1,2,5,6,7,8,9,0 (non-person entity prefixes vary)}.
 * Checksum validation included.
 */
function validateNIF(nif) {
  if (!nif) return { ok: false, error: "NIF em falta" };
  const digits = String(nif).replace(/\D/g, "");
  if (digits.length !== 9) return { ok: false, error: "NIF deve ter 9 dígitos" };

  const valid_starts = ["1", "2", "3", "5", "6", "7", "8", "9", "45"];
  const starts_ok = valid_starts.some((s) => digits.startsWith(s));
  if (!starts_ok) return { ok: false, error: "NIF com prefixo inválido" };

  // Checksum
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(digits[i]) * (9 - i);
  }
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[8]) !== checkDigit) {
    return { ok: false, error: "NIF com dígito de controlo inválido" };
  }
  return { ok: true };
}

/**
 * Validate that the declared total matches the sum of items (within €0.05 tolerance).
 */
function validateInvoiceTotal(dadosExtraidos) {
  const errors = [];
  const items = dadosExtraidos?.lista_itens;
  const total = parseFloat(dadosExtraidos?.total);

  if (!Array.isArray(items) || items.length === 0) return errors;
  if (isNaN(total)) return errors;

  const calculatedTotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantidade) || 1;
    const price = parseFloat(item.preco) || 0;
    return acc + qty * price;
  }, 0);

  // Allow small rounding differences
  if (Math.abs(calculatedTotal - total) > 0.05) {
    errors.push(
      `Total declarado (€${total.toFixed(2)}) não corresponde à soma dos itens (€${calculatedTotal.toFixed(2)})`
    );
  }
  return errors;
}

/**
 * Validate that a date string is not in the future.
 */
function validateDateNotFuture(dateStr, fieldName = "Data") {
  if (!dateStr) return null;
  // Accept common Portuguese formats: dd/mm/yyyy or yyyy-mm-dd
  let date;
  const dmyMatch = String(dateStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const fullYear = y.length === 2 ? "20" + y : y;
    date = new Date(`${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  } else {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) return null; // Can't parse, skip
  if (date > new Date()) {
    return `${fieldName} (${dateStr}) está no futuro`;
  }
  return null;
}

/**
 * Run all validations on extracted invoice data.
 */
function validateInvoice(dados) {
  const errors = [];
  if (!dados) return errors;

  // Required fields
  if (!dados.nome_empresa) errors.push("Nome da empresa em falta");
  if (!dados.data) errors.push("Data da fatura em falta");
  if (!dados.total) errors.push("Total em falta");

  // NIF
  if (dados.nif) {
    const nifResult = validateNIF(dados.nif);
    if (!nifResult.ok) errors.push(`NIF inválido: ${nifResult.error}`);
  }

  // Total vs items
  errors.push(...validateInvoiceTotal(dados));

  // Future dates
  const dateError = validateDateNotFuture(dados.data, "Data da fatura");
  if (dateError) errors.push(dateError);

  return errors;
}

/**
 * Run all validations on extracted transport ticket data.
 */
function validateTicket(dados) {
  const errors = [];
  if (!dados) return errors;

  if (!dados.origem) errors.push("Origem em falta");
  if (!dados.destino) errors.push("Destino em falta");
  if (!dados.data) errors.push("Data em falta");
  if (!dados.empresa) errors.push("Empresa transportadora em falta");

  const dateError = validateDateNotFuture(dados.data, "Data da viagem");
  if (dateError) errors.push(dateError);

  return errors;
}

// Only MobiAzores tickets are accepted for mission completion
const ACCEPTED_TRANSPORT_COMPANIES = [
  "mobiazores",
  "mobi açores",
  "mobi azores",
  "mobi-azores",
  "transportes mobi",
];

/**
 * Validate a transport ticket specifically for mission completion.
 * @param {object} dados - extracted ticket data from AI
 * @param {object} mission - mission object with created_at, type, expires_at
 * @returns {string[]} array of error messages (empty = valid)
 */
function validateTicketForMission(dados, mission) {
  const errors = [];
  if (!dados) {
    errors.push("Não foi possível extrair dados do bilhete.");
    return errors;
  }

  // Must be a ticket
  if (dados.tipo && dados.tipo !== "bilhete") {
    errors.push("O documento enviado não é um bilhete de transporte.");
    return errors;
  }

  // Must have a date
  if (!dados.data) {
    errors.push("Data do bilhete não encontrada no documento.");
    return errors;
  }

  // Must have a company
  if (!dados.empresa) {
    errors.push("Empresa transportadora não encontrada no bilhete.");
    return errors;
  }

  // Check it's an accepted transport company
  const empresaNorm = dados.empresa.toLowerCase().trim();
  const isAccepted = ACCEPTED_TRANSPORT_COMPANIES.some((c) => empresaNorm.includes(c));
  if (!isAccepted) {
    errors.push(
      `A empresa "${dados.empresa}" não é aceite para esta missão. ` +
      "Apenas bilhetes da MobiAzores são válidos."
    );
  }

  // Parse ticket date
  let ticketDate = null;
  const dmyMatch = String(dados.data).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const fullYear = y.length === 2 ? "20" + y : y;
    ticketDate = new Date(`${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  } else {
    ticketDate = new Date(dados.data);
  }

  if (!ticketDate || isNaN(ticketDate.getTime())) {
    errors.push(`Data do bilhete inválida: "${dados.data}".`);
    return errors;
  }

  // Date must not be in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (ticketDate > today) {
    errors.push(`A data do bilhete (${dados.data}) está no futuro.`);
  }

  // Date must fall within the mission period
  if (mission) {
    const missionStart = mission.created_at ? new Date(mission.created_at) : null;
    let missionEnd = mission.expires_at ? new Date(mission.expires_at) : null;

    // Derive end from start + mission type when expires_at is missing
    if (missionStart && !missionEnd) {
      missionEnd = new Date(missionStart);
      if (mission.type === "daily") missionEnd.setDate(missionEnd.getDate() + 1);
      else if (mission.type === "monthly") missionEnd.setMonth(missionEnd.getMonth() + 1);
      else missionEnd.setMonth(missionEnd.getMonth() + 1); // default 1 month
    }

    if (missionStart && missionEnd) {
      // Normalize to whole day comparison
      const ticketDay = new Date(ticketDate);
      ticketDay.setHours(0, 0, 0, 0);
      const startDay = new Date(missionStart);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(missionEnd);
      endDay.setHours(23, 59, 59, 999);

      if (ticketDay < startDay || ticketDay > endDay) {
        errors.push(
          `A data do bilhete (${dados.data}) não está dentro do período da missão ` +
          `(${startDay.toLocaleDateString("pt-PT")} – ${endDay.toLocaleDateString("pt-PT")}).`
        );
      }
    } else {
      // No dates at all — accept tickets from the last 60 days only
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      sixtyDaysAgo.setHours(0, 0, 0, 0);
      if (ticketDate < sixtyDaysAgo) {
        errors.push(`A data do bilhete (${dados.data}) é demasiado antiga (mais de 60 dias).`);
      }
    }
  }

  return errors;
}

module.exports = { validateNIF, validateInvoice, validateTicket, validateTicketForMission };
