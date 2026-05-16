"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificação em falta.");
      return;
    }

    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          if (data.token) localStorage.setItem("token", data.token);
          setStatus("success");
          setMessage(data.message || "Email confirmado com sucesso!");
          setTimeout(() => router.push("/user"), 2500);
        } else {
          setStatus("error");
          setMessage(data.error || "Erro ao verificar email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erro de ligação ao servidor.");
      });
  }, [token, router]);

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
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: "#1f2937" }}>A verificar o teu email...</h2>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#15803d", marginBottom: 8 }}>Email confirmado!</h2>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>{message}</p>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>A redirecionar para o dashboard...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#dc2626", marginBottom: 8 }}>Verificação falhou</h2>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>{message}</p>
            <button
              onClick={() => router.push("/")}
              style={{
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
              Voltar ao Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>A carregar...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
