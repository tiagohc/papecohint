"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AuthForm() {
  const { t, setLanguage, language } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<'pt' | 'en'>('pt');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Criar conta
        const res = await fetch("http://localhost:8000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao criar conta");
          setLoading(false);
          return;
        }

        // login automático após registro
        const loginRes = await fetch("http://localhost:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          setError(loginData.error || "Erro ao entrar");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", loginData.token);
        const payload = JSON.parse(atob(loginData.token.split(".")[1]));
        window.location.href = payload.role === "admin" ? "/admin/users" : "/user";

      } else {
        // Login
        const res = await fetch("http://localhost:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro no login");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.token);
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        window.location.href = payload.role === "admin" ? "/admin/users" : "/user";
      }

    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Erro ao conectar com o servidor");
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
        <label style={{ fontSize: 12, marginBottom: 5, color: "#333" }}>{t("Selecionar idioma")}</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'pt' | 'en')}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <option value="pt">{t("Português")}</option>
          <option value="en">{t("Inglês")}</option>
        </select>
      </div>

      <div style={{ marginBottom: 40 }}>
        <Image src="/logoback.png" alt="EcoHint Logo" width={320} height={320} />
      </div>

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
            placeholder={t("Nome")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 6, fontSize: 16 }}
          />
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
          <p style={{ textAlign: "center", marginTop: 5 }}>
            <span
              onClick={() => (window.location.href = "/forgot-password")}
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {t("Esqueci a password")}
            </span>
          </p>
        )}
      </form>
    </div>
  );
}
