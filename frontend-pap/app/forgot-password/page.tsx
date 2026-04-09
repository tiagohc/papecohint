"use client";

import { useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return setError(data.error || t("Erro ao enviar email"));
      setMessage(t("Email de recuperação enviado! Verifica a tua caixa de entrada."));
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(t("Erro ao conectar com o servidor"));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", padding:20, background:"linear-gradient(135deg,#a5d6a7 0%,#fff59d 100%)" }}>
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", maxWidth:400, gap:16, background:"#fff", padding:30, borderRadius:12, boxShadow:"0 10px 25px rgba(0,0,0,0.1)" }}>
        <h2 style={{textAlign:"center"}}>{t("Recuperar Password")}</h2>
        <input type="email" placeholder={t("Email")} value={email} onChange={e=>setEmail(e.target.value)} required style={{padding:12,borderRadius:6,fontSize:16}} />
        <button type="submit" disabled={loading} style={{padding:12,borderRadius:6, border:"none", backgroundColor:"#2e7d32", color:"#fff", fontWeight:"bold", fontSize:16, cursor:"pointer"}}>
          {loading ? t("Enviando...") : t("Enviar link")}
        </button>
        {error && <p style={{color:"red", textAlign:"center"}}>{error}</p>}
        {message && <p style={{color:"green", textAlign:"center"}}>{message}</p>}
      </form>
    </div>
  );
}
