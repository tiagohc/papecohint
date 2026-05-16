export type PasswordCheck = {
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Letra maiúscula (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Letra minúscula (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "Número (0-9)", test: (pw) => /[0-9]/.test(pw) },
  { label: "Caractere especial (!@#$%...)", test: (pw) => /[!@#$%^&*()\-_=+\[\]{};:',.<>?/\\|`~]/.test(pw) },
];

export function validatePassword(password: string): string | null {
  for (const check of PASSWORD_CHECKS) {
    if (!check.test(password)) return check.label;
  }
  return null;
}
