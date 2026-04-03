"use client";

import { useState, useEffect } from "react";
import { getLevelFromPoints, carbonSavedFromPoints } from "@/lib/progress";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
}

export default function PerfilPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar dados do usuário do localStorage (simulando dados do backend)
    const storedUser = localStorage.getItem("ecohint-user");
    const storedPoints = localStorage.getItem("ecohint-points");

    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserProfile({
        id: userData.id || 1,
        name: userData.name || "Usuário EcoHint",
        email: userData.email || "usuario@ecohint.com",
        role: userData.role || "user",
        status: userData.status || "active",
        avatar: userData.avatar || null,
      });
      setEditForm({
        name: userData.name || "Usuário EcoHint",
        email: userData.email || "usuario@ecohint.com",
      });
    } else {
      // Dados padrão se não houver no localStorage
      setUserProfile({
        id: 1,
        name: "Usuário EcoHint",
        email: "usuario@ecohint.com",
        role: "user",
        status: "active",
        avatar: undefined,
      });
      setEditForm({
        name: "Usuário EcoHint",
        email: "usuario@ecohint.com",
      });
    }

    setUserPoints(storedPoints ? Number(storedPoints) : 0);
  }, []);

  const userLevel = getLevelFromPoints(userPoints);
  const userCarbon = carbonSavedFromPoints(userPoints);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        setUserProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);

        // Salvar no localStorage
        const storedUser = localStorage.getItem("ecohint-user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.avatar = avatarUrl;
          localStorage.setItem("ecohint-user", JSON.stringify(userData));
        } else {
          localStorage.setItem("ecohint-user", JSON.stringify({
            id: 1,
            name: "Usuário EcoHint",
            email: "usuario@ecohint.com",
            role: "user",
            status: "active",
            avatar: avatarUrl,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUserProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        email: editForm.email,
      } : null);

      // Salvar no localStorage
      const storedUser = localStorage.getItem("ecohint-user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.name = editForm.name;
        userData.email = editForm.email;
        localStorage.setItem("ecohint-user", JSON.stringify(userData));
      }

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
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const statCardStyle: React.CSSProperties = {
    ...cardStyle,
    textAlign: "center",
    flex: 1,
  };

  if (!userProfile) {
    return (
      <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
        <div style={cardStyle}>
          <p>Carregando perfil...</p>
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
                  alt="Foto de perfil"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span>👤</span>
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
              title="Alterar foto de perfil"
            >
              📷
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
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
                  backgroundColor: userProfile.status === "active" ? "#dcfce7" : "#fee2e2",
                  color: userProfile.status === "active" ? "#166534" : "#991b1b",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {userProfile.status === "active" ? "Ativo" : "Inativo"}
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
                {userProfile.role === "admin" ? "Administrador" : "Usuário"}
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
            {isEditing ? "Cancelar" : "Editar Perfil"}
          </button>
        </div>
      </div>

      {/* Formulário de Edição */}
      {isEditing && (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 20px 0" }}>Editar Perfil</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                Nome
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

            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
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
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>
            {userPoints.toLocaleString()}
          </div>
          <div style={{ color: "#666", fontSize: 14 }}>Pontos Totais</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>
            {userLevel.level}
          </div>
          <div style={{ color: "#666", fontSize: 14 }}>Nível Atual</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6", marginBottom: 8 }}>
            {Math.round(userCarbon)}
          </div>
          <div style={{ color: "#666", fontSize: 14 }}>kg CO₂ Economizados</div>
        </div>
      </div>

      {/* Progresso para Próximo Nível */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0" }}>Progresso para Nível {userLevel.level + 1}</h2>
        <div style={{ marginBottom: 8 }}>
          <div style={{
            width: "100%",
            height: 12,
            backgroundColor: "#e5e7eb",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <div
              style={{
                width: `${userLevel.progress}%`,
                height: "100%",
                backgroundColor: "#22c55e",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#666" }}>
          <span>{userPoints} / {userLevel.pointsToNextLevel} pontos</span>
          <span>{Math.round(userLevel.progress * 100)}% completo</span>
        </div>
      </div>

      {/* Conquistas Recentes */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0" }}>Conquistas Recentes</h2>
        {userPoints > 0 ? (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {userPoints >= 50 && (
              <div style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}></div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: 16 }}>Primeira Missão</h4>
                <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Completou sua primeira missão sustentável</p>
              </div>
            )}

            {userPoints >= 100 && (
              <div style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}></div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: 16 }}>Eco Warrior</h4>
                <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Economizou mais de 100kg de CO₂</p>
              </div>
            )}

            {userPoints > 0 && (
              <div style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}></div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: 16 }}>Nível {userLevel.level}</h4>
                <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Alcançou o nível {userLevel.level} no EcoHint</p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "#666" }}>Sem conquistas ainda. Complete sua primeira missão para conquistar troféus.</p>
        )}
      </div>
    </div>
  );
}
