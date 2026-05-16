/**
 * Valida a força de uma password.
 * Regras:
 *  - Mínimo 8 caracteres
 *  - Pelo menos 1 letra maiúscula
 *  - Pelo menos 1 letra minúscula
 *  - Pelo menos 1 número
 *  - Pelo menos 1 caractere especial (!@#$%^&*...)
 *
 * @param {string} password
 * @returns {{ valid: boolean, error: string | null }}
 */
function validatePassword(password) {
  if (!password || password.length < 8)
    return { valid: false, error: "A password deve ter pelo menos 8 caracteres." };
  if (!/[A-Z]/.test(password))
    return { valid: false, error: "A password deve conter pelo menos uma letra maiúscula." };
  if (!/[a-z]/.test(password))
    return { valid: false, error: "A password deve conter pelo menos uma letra minúscula." };
  if (!/[0-9]/.test(password))
    return { valid: false, error: "A password deve conter pelo menos um número." };
  if (!/[!@#$%^&*()\-_=+\[\]{};:',.<>?/\\|`~]/.test(password))
    return { valid: false, error: "A password deve conter pelo menos um caractere especial (!@#$%...)." };
  return { valid: true, error: null };
}

module.exports = { validatePassword };
