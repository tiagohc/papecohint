"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
}

export default function PerfilPage() {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Token lido uma vez no mount — não muda durante a sessão
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUserProfile({
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          role: data.role || "user",
          status: data.status || "active",
          avatar: data.avatar_url || undefined,
        });
        setEditForm({ name: data.name || "" });
      })
      .catch(console.error);
  }, []);

  // Envia a imagem para a API, guarda no servidor e actualiza o estado local
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setAvatarLoading(true);
    setAvatarError(null);

    // Resize to max 300×300 and convert to base64 (persists on Render - no disk storage)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 300;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      if (!res.ok) throw new Error("Erro ao enviar avatar");
      const data = await res.json();
      setUserProfile(prev => prev ? { ...prev, avatar: data.avatar_url } : null);
      // Avisa o header para actualizar o avatar
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      console.error("Erro ao actualizar avatar:", err);
      setAvatarError(t("Erro ao guardar foto. Tenta novamente."));
    } finally {
      setAvatarLoading(false);
    }
  };

  // Guarda o nome actualizado via API e notifica o header
  const handleSaveProfile = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editForm.name }),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      const updated = await res.json();
      setUserProfile(prev => prev ? { ...prev, name: updated.name } : null);
      window.dispatchEvent(new Event("profile-updated"));
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "var(--bg-card, #fff)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  if (!userProfile) {
    return (
      <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
        <div style={cardStyle}>
          <p>{t("Carregando perfil...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      {/* Header do Perfil */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Foto de Perfil */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                backgroundColor: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "#64748b",
                overflow: "hidden",
              }}
            >
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={t("Foto de perfil")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ fontSize: 32, color: "var(--text-secondary)" }}>&#9786;</span>
              )}
            </div>

            {/* Botão para mudar foto */}
            <label
              htmlFor="avatar-input"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "#22c55e",
                color: "white",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 16,
              }}
              title={t("Alterar foto de perfil")}
            >
              {avatarLoading ? "…" : "+"}
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              disabled={avatarLoading}
            />
            {avatarError && (
              <p style={{ color: "#ef4444", fontSize: 12, margin: "6px 0 0 0", textAlign: "center" }}>{avatarError}</p>
            )}
          </div>

          {/* Informações do Usuário */}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: 28 }}>{userProfile.name}</h1>
            <p style={{ margin: "0 0 8px 0", color: "#666" }}>{userProfile.email}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {t("Online")}
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  backgroundColor: "#e0f2fe",
                  color: "#0277bd",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {userProfile.role === "admin" ? t("Administrador") : t("Usuário")}
              </span>
            </div>
          </div>

          {/* Botão Editar */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              backgroundColor: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {isEditing ? t("Cancelar") : t("Editar Perfil")}
          </button>
        </div>
      </div>

      {/* Formulário de Edição */}
      {isEditing && (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 20px 0" }}>{t("Editar Perfil")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                {t("Nome")}
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#22c55e",
                  color: "white",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {isLoading ? t("Salvando...") : t("Salvar Alterações")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sobre a EcoHint */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>🌱 {t("O que é a EcoHint?")}</h2>
        <p style={{ margin: "0 0 12px 0", color: "var(--text-main, #374151)", lineHeight: 1.7 }}>
          {t("A EcoHint é uma plataforma que te recompensa por adotares comportamentos sustentáveis no dia a dia. Completa missões ecológicas, ganha EcoPts e troca-os por produtos e descontos dos nossos parceiros.")}
        </p>
      </div>

      {/* Como funciona */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0" }}>📋 {t("Como funciona")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "✅", title: t("Completa Missões"), desc: t("Usa transportes públicos, recicla, poupa energia e outras ações sustentáveis. Cada missão tem pontuação própria.") },
            { icon: "🏆", title: t("Ganha EcoPts"), desc: t("Cada missão concluída e validada adiciona EcoPts à tua conta. Quanto mais missões, mais pontos.") },
            { icon: "🛒", title: t("Resgata Recompensas"), desc: t("Vai à Loja de Pontos e troca os teus EcoPts por produtos reais dos parceiros EcoHint.") },
            { icon: "📊", title: t("Acompanha o teu Impacto"), desc: t("Na secção Impacto Ambiental podes ver o CO₂ que poupaste, as viagens de autocarro e muito mais.") },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", backgroundColor: "var(--bg-secondary, #f9fafb)", borderRadius: 8 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
              <div>
                <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "var(--text-main, #1f2937)" }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary, #6b7280)", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regras */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0" }}>📌 {t("Regras e Notas")}</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-main, #374151)", lineHeight: 2, fontSize: 14 }}>
          <li>{t("Cada missão só pode ser submetida uma vez por período (diária ou mensal).")}</li>
          <li>{t("As submissões de foto ou bilhete são verificadas manualmente por um administrador.")}</li>
          <li>{t("Os EcoPts não têm prazo de validade enquanto a conta estiver ativa.")}</li>
          <li>{t("Ao resgatar uma recompensa, os pontos são descontados imediatamente.")}</li>
          <li>{t("O stock das recompensas é limitado — resgata antes que esgote!")}</li>
          <li>{t("Em caso de dúvidas, contacta o suporte através da secção de notificações.")}</li>
        </ul>
      </div>

    </div>
  );
}
