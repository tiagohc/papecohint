"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/passwordValidator";
import { useLanguage } from "@/app/components/LanguageProvider";

const LANGUAGES = [
  { code: "pt" as const, label: "Português", flag: "🇵🇹" },
  { code: "en" as const, label: "English",   flag: "🇬🇧" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 12,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

export default function RegisterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { setLanguage } = useLanguage();

  const [selectedLang, setSelectedLang] = useState<"pt" | "en">("pt");

  // Keep global language in sync when user picks in registration
  const handleLangSelect = (code: "pt" | "en") => {
    setSelectedLang(code);
    setLanguage(code);
  };

  // Use selectedLang as the language to send to backend
  const language = selectedLang;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); setLoading(false); return; }

    try {
      // 1. Register user
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, language }),
      });

      if (res.status === 429) {
        // Render free tier sometimes throttles on wake-up — retry once after 3s
        setError("Servidor a acordar... a tentar novamente em 3 segundos.");
        await new Promise((r) => setTimeout(r, 3000));
        const retry = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, language }),
        });
        if (retry.status === 429) {
          setError("Servidor temporariamente sobrecarregado. Aguarda uns segundos e tenta novamente.");
          setLoading(false);
          return;
        }
        const retryData = await retry.json();
        if (!retry.ok) {
          setError(retryData.error || "Erro ao criar conta");
          setLoading(false);
          return;
        }
        // Conta criada (retry) — mostrar ecrã de verificação
        setEmailSent(true);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      // Conta criada — mostrar ecrã de verificação de email
      setEmailSent(true);
      setLoading(false);
      return;
    } catch {
      setError("Erro ao conectar com o servidor");
      setLoading(false);
    }
  };

  // Ecrã de confirmação de email
  if (emailSent) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #a5d6a7 0%, #fff59d 100%)",
        padding: 16,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 48,
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: "#1f2937", marginBottom: 8 }}>Verifica o teu email!</h2>
          <p style={{ color: "#6b7280", marginBottom: 8, lineHeight: 1.6 }}>
            Enviamos um email de confirmação para <strong>{email}</strong>.
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
            Clica no link no email para ativar a tua conta.
            Verifica também a pasta de spam.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: 24,
              padding: "11px 24px",
              backgroundColor: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #a5d6a7 0%, #fff59d 100%)",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 12,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 24, color: "#1f2937" }}>
          Criar Conta EcoHint
        </h2>

        {/* Avatar picker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: "2px dashed #a3a3a3",
              backgroundColor: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 28 }}>📷</span>
            )}
          </div>
          <span
            onClick={() => fileRef.current?.click()}
            style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}
          >
            {avatarPreview ? "Alterar foto" : "Adicionar foto de perfil"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Username</label>
        <input
          type="text"
          placeholder="@username"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
          required
          minLength={3}
          maxLength={30}
          style={inputStyle}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Email</label>
        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Password</label>
        <input
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <PasswordStrengthIndicator password={password} />

        {/* Language selector */}
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>
            🌐 Idioma da conta / Account language
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLangSelect(lang.code)}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: selectedLang === lang.code ? "2px solid #22c55e" : "2px solid #e5e7eb",
                  backgroundColor: selectedLang === lang.code ? "#f0fdf4" : "#fff",
                  cursor: "pointer",
                  fontWeight: selectedLang === lang.code ? 700 : 400,
                  fontSize: 14,
                  color: selectedLang === lang.code ? "#15803d" : "#6b7280",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {selectedLang === lang.code && <span style={{ marginLeft: 2 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: loading ? "#a3a3a3" : "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
          }}
        >
          {loading ? "A criar conta..." : "Criar Conta"}
        </button>

        {error && <p style={{ color: "#dc2626", marginTop: 10, fontSize: 13, textAlign: "center" }}>{error}</p>}

        <p style={{ marginTop: 18, textAlign: "center", fontSize: 14, color: "#6b7280" }}>
          Já tens conta?{" "}
          <span
            onClick={() => router.push("/")}
            style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "bold" }}
          >
            Entrar
          </span>
        </p>
      </form>
    </div>
  );
}
