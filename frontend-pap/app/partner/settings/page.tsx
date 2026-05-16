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

export default function PartnerSettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Store info
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError, setStoreError] = useState("");
  const [storeSuccess, setStoreSuccess] = useState("");
  const [storeSaving, setStoreSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("token");
    if (!t) { router.push("/"); return; }
    fetch("/api/partner/settings", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStoreName(data.name || "");
        setStoreDescription(data.description || "");
        setStoreLoading(false);
      })
      .catch(() => setStoreLoading(false));
  }, []);

  const handleSaveStore = async () => {
    if (!token) return;
    setStoreError("");
    setStoreSuccess("");
    if (!storeName.trim()) {
      setStoreError(t("O nome da loja não pode estar vazio."));
      return;
    }
    setStoreSaving(true);
    try {
      const res = await fetch("/api/partner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: storeName.trim(), description: storeDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar.");
      setStoreSuccess(t("Definições guardadas com sucesso!"));
    } catch (err: unknown) {
      setStoreError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setStoreSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError(t("Preenche todos os campos."));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t("As passwords não coincidem."));
      return;
    }
    const pwValidationError = validatePassword(newPassword);
    if (pwValidationError) { setPwError(pwValidationError); return; }
    if (!token) { router.push("/"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao alterar password.");
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
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: 20,
    border: "1px solid var(--border)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1.5px solid var(--border)",
    fontSize: 14,
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-main)",
    outline: "none",
    boxSizing: "border-box",
  };

  const optionStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderRadius: 10,
    border: active ? "2px solid #22c55e" : "2px solid var(--border)",
    backgroundColor: active ? "#f0fdf4" : "var(--bg-secondary)",
    cursor: "pointer",
    transition: "all 0.15s",
    userSelect: "none",
  });

  const radioStyle = (active: boolean) => (
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      border: "2px solid #22c55e",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {active && <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22c55e" }} />}
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px 0", fontSize: 26, fontWeight: 700, color: "var(--text-main)" }}>
        {t("Definições")}
      </h1>

      {/* Store name */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "var(--text-main)" }}>
          🏪 {t("Nome da Loja")}
        </h2>
        {storeLoading ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{t("A carregar...")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "var(--bg-secondary)",
              border: "1.5px solid var(--border)",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}>
              <span style={{ fontWeight: 500 }}>{t("Nome atual")}: </span>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{storeName || "—"}</span>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                {t("Nome da loja")}
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                {t("Descrição")} <span style={{ opacity: 0.6 }}>({t("opcional")})</span>
              </label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              />
            </div>
            {storeError && <p style={{ margin: 0, color: "#ef4444", fontSize: 13 }}>{storeError}</p>}
            {storeSuccess && <p style={{ margin: 0, color: "#22c55e", fontSize: 13 }}>{storeSuccess}</p>}
            <button
              onClick={handleSaveStore}
              disabled={storeSaving}
              style={{
                padding: "11px 0", borderRadius: 8, border: "none",
                backgroundColor: storeSaving ? "#86efac" : "#22c55e",
                color: "white", fontWeight: 700, fontSize: 14,
                cursor: storeSaving ? "not-allowed" : "pointer",
              }}
            >
              {storeSaving ? t("A guardar...") : t("Guardar")}
            </button>
          </div>
        )}
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "var(--text-main)" }}>
          🌐 {t("Idioma")}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {languages.map((lang) => (
            <div key={lang.code} style={optionStyle(language === lang.code)} onClick={() => setLanguage(lang.code)}>
              {radioStyle(language === lang.code)}
              <span style={{ fontWeight: language === lang.code ? 600 : 400, color: "var(--text-main)" }}>
                {lang.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "var(--text-main)" }}>
          🔑 {t("Alterar Password")}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: t("Password atual"), value: currentPassword, setter: setCurrentPassword },
            { label: t("Nova password"), value: newPassword, setter: setNewPassword },
            { label: t("Confirmar nova password"), value: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                style={inputStyle}
              />
              {label === t("Nova password") && <PasswordStrengthIndicator password={value} />}
            </div>
          ))}
          {pwError && <p style={{ margin: 0, color: "#ef4444", fontSize: 13 }}>{pwError}</p>}
          {pwSuccess && <p style={{ margin: 0, color: "#22c55e", fontSize: 13 }}>{pwSuccess}</p>}
          <button
            onClick={handleChangePassword}
            disabled={pwLoading}
            style={{
              padding: "11px 0", borderRadius: 8, border: "none",
              backgroundColor: pwLoading ? "#86efac" : "#22c55e",
              color: "white", fontWeight: 700, fontSize: 14,
              cursor: pwLoading ? "not-allowed" : "pointer",
            }}
          >
            {pwLoading ? t("A guardar...") : t("Alterar Password")}
          </button>
        </div>
      </div>

      {/* Theme */}
      {mounted && (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "var(--text-main)" }}>
            🎨 {t("Aparência")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { value: "light", label: t("Modo Claro"), icon: "☀️" },
              { value: "dark", label: t("Modo Escuro"), icon: "🌙" },
            ].map((opt) => (
              <div key={opt.value} style={optionStyle(theme === opt.value)} onClick={() => setTheme(opt.value)}>
                {radioStyle(theme === opt.value)}
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ fontWeight: theme === opt.value ? 600 : 400, color: "var(--text-main)" }}>
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
