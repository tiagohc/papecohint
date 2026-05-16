"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";

export default function AuthForm() {
  const { t, setLanguage, language } = useLanguage();
  const { setTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerLang, setRegisterLang] = useState<"pt" | "en">("pt");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "pt" as const, label: t("Português"), short: "PT" },
    { code: "en" as const, label: "English", short: "EN" },
  ];

  useEffect(() => {
    // Login must always open in default light mode.
    setTheme("light");
    localStorage.removeItem("theme");
  }, [setTheme]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Criar conta
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, language: registerLang }),
        });

        if (res.status === 429) {
          setError(t("Servidor sobrecarregado. Aguarda uns segundos e tenta novamente."));
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t("Erro ao criar conta"));
          setLoading(false);
          return;
        }

        // Email de verificação enviado
        setLanguage(registerLang);
        setEmailSent(true);
        setLoading(false);
        return;

      } else {
        // Login
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.status === 429) {
          setError(t("Servidor sobrecarregado. Aguarda uns segundos e tenta novamente."));
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          if (data.requiresVerification) {
            setError("📧 " + (data.error || "Verifica o teu email antes de iniciar sessão."));
          } else {
            setError(data.error || t("Erro no login"));
          }
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.token);
        // Aplicar idioma guardado na conta
        if (data.user?.language) {
          setLanguage(data.user.language);
        }
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        if (payload.role === "admin") {
          window.location.href = "/admin/users";
        } else if (payload.role === "partner") {
          window.location.href = "/partner";
        } else {
          window.location.href = "/user";
        }
      }

    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(t("Erro ao conectar com o servidor"));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #a5d6a7 0%, #fff59d 100%)",
        padding: 20,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <label style={{ fontSize: 12, marginBottom: 8, color: "#333" }}>{t("Selecionar idioma")}</label>
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            title="Idioma / Language"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {currentLang.short}
          </button>

          {langOpen && (
            <div
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: 160,
                overflow: "hidden",
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 14px",
                    border: "none",
                    background: language === lang.code ? "#f3f4f6" : "transparent",
                    color: "#111827",
                    cursor: "pointer",
                    fontSize: 14,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 24 }}>{lang.short}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && <span style={{ marginLeft: "auto" }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 40 }}>
        <Image src="/logoback.png" alt="EcoHint Logo" width={320} height={320} />
      </div>

      {/* Ecrã de verificação de email após registo */}
      {emailSent ? (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          maxWidth: 320,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <h3 style={{ color: "#1f2937", marginBottom: 8 }}>Verifica o teu email!</h3>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
            Enviamos um link de confirmação para <strong>{email}</strong>.
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>
            Clica no link para ativar a conta. Verifica também a pasta de spam.
          </p>
          <button
            onClick={() => { setEmailSent(false); setIsRegister(false); }}
            style={{
              padding: "10px 20px",
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
      ) : (
        <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 320,
          gap: 16,
          background: "#fff",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        {isRegister && (
          <input
            type="text"
            placeholder={t("Username")}
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            required
            minLength={3}
            maxLength={30}
            style={{ padding: 12, borderRadius: 6, fontSize: 16 }}
          />
        )}

        {/* Seletor de idioma da conta (só no registo) */}
        {isRegister && (
          <div>
            <p style={{ margin: "0 0 8px 0", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
              🌐 {t("Idioma da conta")}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {([{code: "pt" as const, flag: "🇵🇹", label: "PT"}, {code: "en" as const, flag: "🇬🇧", label: "EN"}]).map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setRegisterLang(l.code)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: registerLang === l.code ? "2px solid #22c55e" : "2px solid #e5e7eb",
                    backgroundColor: registerLang === l.code ? "#f0fdf4" : "#fff",
                    cursor: "pointer",
                    fontWeight: registerLang === l.code ? 700 : 400,
                    fontSize: 14,
                    color: registerLang === l.code ? "#15803d" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {l.flag} {l.label} {registerLang === l.code && "✓"}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          type="email"
          placeholder={t("Email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 6, fontSize: 16 }}
        />

        <input
          type="password"
          placeholder={t("Password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 6, fontSize: 16 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 6,
            border: "none",
            backgroundColor: "#2e7d32",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {loading ? (isRegister ? t("Criando...") : t("A entrar...")) : isRegister ? t("Criar Conta") : t("Entrar")}
        </button>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <p style={{ textAlign: "center", marginTop: 10 }}>
          {isRegister ? t("Já tens conta?") : t("Ainda não tens conta?")}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{
              color: "#2e7d32",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isRegister ? t("Entrar") : t("Criar conta")}
          </span>
        </p>

        {/* Link para esquecer password */}
        {!isRegister && (
          <div style={{ textAlign: "center", marginTop: 5 }}>
            <span
              onClick={async () => {
                if (forgotLoading) return;
                if (!email) {
                  setForgotMessage(t("Introduz o teu email no campo acima"));
                  return;
                }
                setForgotLoading(true);
                setForgotMessage("");
                try {
                  const res = await fetch("/api/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  const data = await res.json();
                  setForgotMessage(res.ok
                    ? t("Email de recuperação enviado! Verifica a tua caixa de entrada.")
                    : data.error || t("Erro ao enviar email"));
                } catch {
                  setForgotMessage(t("Erro ao conectar com o servidor"));
                } finally {
                  setForgotLoading(false);
                }
              }}
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                cursor: forgotLoading ? "wait" : "pointer",
              }}
            >
              {forgotLoading ? t("Enviando...") : t("Esqueci a password")}
            </span>
            {forgotMessage && (
              <p style={{ fontSize: 13, marginTop: 6, color: forgotMessage.includes("enviado") || forgotMessage.includes("sent") ? "#2e7d32" : "red" }}>
                {forgotMessage}
              </p>
            )}
          </div>
        )}
      </form>
      )}
    </div>
  );
}
