/**
 * Fixes Portuguese characters that were corrupted when stored via a latin1
 * MySQL connection. Each accented UTF-8 byte pair was saved as "??".
 * Replacements are word-based to avoid ambiguity.
 */
const PATTERNS: [string, string][] = [
  // ã / Ã
  ["miss??o",       "missão"],
  ["Miss??o",       "Missão"],
  ["MIS??O",        "MISSÃO"],
  ["gest??o",       "gestão"],
  ["Gest??o",       "Gestão"],
  ["sess??o",       "sessão"],
  ["Sess??o",       "Sessão"],
  ["informa????o",   "informação"],
  ["Informa????o",   "Informação"],
  ["atualiza????o",  "atualização"],
  ["Atualiza????o",  "Atualização"],
  ["ATUALIZA????O",  "ATUALIZAÇÃO"],
  // ç + ã  → ????
  ["op????o",       "opção"],
  ["Op????o",       "Opção"],
  ["solu????o",     "solução"],
  ["Solu????o",     "Solução"],
  ["medita????o",   "meditação"],
  ["Medita????o",   "Meditação"],
  ["prote????o",    "proteção"],
  ["Prote????o",    "Proteção"],
  // í
  ["dispon??vel",   "disponível"],
  ["Dispon??vel",   "Disponível"],
  // á
  ["sustent??vel",  "sustentável"],
  ["Sustent??vel",  "Sustentável"],
  ["reutiliz??vel", "reutilizável"],
  ["Reutiliz??vel", "Reutilizável"],
  ["di??ria",       "diária"],
  ["Di??ria",       "Diária"],
  // é
  ["energ??tica",   "energética"],
  ["Energ??tica",   "Energética"],
  // ó
  ["ecol??gico",    "ecológico"],
  ["Ecol??gico",    "Ecológico"],
  // ú
  ["p??blico",      "público"],
  ["P??blico",      "Público"],
  // à
  ["?? loja",       "à loja"],
  ["chegou ??",     "chegou à"],
];

export function fixEncoding(str: string | null | undefined): string {
  if (!str) return str ?? "";
  let result = str;
  for (const [broken, fixed] of PATTERNS) {
    result = result.split(broken).join(fixed);
  }
  return result;
}
