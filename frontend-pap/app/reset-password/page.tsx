"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

function ResetPasswordForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(t("Token inválido ou inexistente"));
      return;
    }

    if (password.length < 6) {
      setError(t("A password deve ter pelo menos 6 caracteres"));
      return;
    }

    if (password !== confirm) {
      setError(t("As passwords não coincidem"));
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("Erro ao redefinir password"));
        return;
      }

      setSuccess(t("Password alterada com sucesso. A redirecionar para o login..."));

      setTimeout(() => {
        router.push("/"); // ✅ LOGIN ESTÁ NA ROOT
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(t("Erro de ligação ao servidor"));
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <h2>{t("Redefinir Password")}</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="password"
          placeholder={t("Nova password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder={t("Confirmar password")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button type="submit">{t("Alterar password")}</button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
