"use client";

import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/passwordValidator";

const languages = [
  { code: "pt" as const, label: "Português" },
  { code: "en" as const, label: "English" },
];

export default function AdminSettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Admin name
  const [adminName, setAdminName] = useState("");
  const [nameLoading, setNameLoading] = useState(true);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/"); return; }
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAdminName(data.name || ""); setNameLoading(false); })
      .catch(() => setNameLoading(false));
  }, [router]);

  const handleSaveName = async () => {
    setNameError("");
    setNameSuccess("");
    if (!adminName.trim()) { setNameError(t("O nome não pode estar vazio.")); return; }
    const token = localStorage.getItem("token");
    if (!token) return;
    setNameSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: adminName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar.");
      setNameSuccess(t("Nome atualizado com sucesso!"));
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) { setPwError(t("Preenche todos os campos.")); return; }
    if (newPassword !== confirmPassword) { setPwError(t("As passwords não coincidem.")); return; }
    const pwValidationError = validatePassword(newPassword);
    if (pwValidationError) { setPwError(pwValidationError); return; }
    const token = localStorage.getItem("token");
    if (!token) { router.push("/"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar password.");
      setPwSuccess(t("Password alterada com sucesso!"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setPwLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-card)",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
    border: "1px solid var(--border)",
    padding: 24,
    marginBottom: 20,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 6,
    border: "1px solid var(--border)", fontSize: 14,
    backgroundColor: "var(--bg-card)", color: "var(--text-main)",
    boxSizing: "border-box",
  };
  const btnStyle: React.CSSProperties = {
    padding: "10px 20px", borderRadius: 8, border: "none",
    backgroundColor: "#16a34a", color: "#fff",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24, color: "var(--text-main)" }}>{t("Definições")}</h1>

      {/* Nome do Admin */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: 16, color: "var(--text-main)" }}>👤 {t("Nome do Admin")}</h2>
        <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--text-secondary)" }}>
          {t("Nome atual:")} <strong>{nameLoading ? "..." : adminName}</strong>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inputStyle}
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            placeholder={t("Novo nome")}
          />
          {nameError && <p style={{ margin: 0, color: "#dc2626", fontSize: 13 }}>{nameError}</p>}
          {nameSuccess && <p style={{ margin: 0, color: "#16a34a", fontSize: 13 }}>{nameSuccess}</p>}
          <button onClick={handleSaveName} disabled={nameSaving} style={{ ...btnStyle, opacity: nameSaving ? 0.7 : 1 }}>
            {nameSaving ? t("A guardar...") : t("Guardar nome")}
          </button>
        </div>
      </div>

      {/* Idioma */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, color: "var(--text-main)" }}>🌐 {t("Idioma")}</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              style={{
                padding: "8px 20px", borderRadius: 8,
                border: language === lang.code ? "2px solid #16a34a" : "1px solid var(--border)",
                backgroundColor: language === lang.code ? "#dcfce7" : "var(--bg-card)",
                color: language === lang.code ? "#166534" : "var(--text-main)",
                fontWeight: language === lang.code ? 700 : 400,
                cursor: "pointer", fontSize: 14,
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aparência */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, color: "var(--text-main)" }}>🎨 {t("Aparência")}</h2>
        {mounted && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{ value: "light", label: "☀️ " + t("Claro") }, { value: "dark", label: "🌙 " + t("Escuro") }].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                style={{
                  padding: "8px 20px", borderRadius: 8,
                  border: theme === opt.value ? "2px solid #16a34a" : "1px solid var(--border)",
                  backgroundColor: theme === opt.value ? "#dcfce7" : "var(--bg-card)",
                  color: theme === opt.value ? "#166534" : "var(--text-main)",
                  fontWeight: theme === opt.value ? 700 : 400,
                  cursor: "pointer", fontSize: 14,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alterar Password */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, color: "var(--text-main)" }}>🔑 {t("Alterar Password")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inputStyle} type="password" placeholder={t("Password atual")} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          <input style={inputStyle} type="password" placeholder={t("Nova password")} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <PasswordStrengthIndicator password={newPassword} />
          <input style={inputStyle} type="password" placeholder={t("Confirmar nova password")} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          {pwError && <p style={{ margin: 0, color: "#dc2626", fontSize: 13 }}>{pwError}</p>}
          {pwSuccess && <p style={{ margin: 0, color: "#16a34a", fontSize: 13 }}>{pwSuccess}</p>}
          <button onClick={handleChangePassword} disabled={pwLoading} style={{ ...btnStyle, opacity: pwLoading ? 0.7 : 1 }}>
            {pwLoading ? t("A alterar...") : t("Alterar password")}
          </button>
        </div>
      </div>
    </div>
  );
}
