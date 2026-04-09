"use client";

import { useEffect, useState, useRef } from "react";
import { getLevelFromPoints } from "@/lib/progress";
import { useLanguage } from "@/app/components/LanguageProvider";

type Mission = {
  id: number;
  title: string;
  description: string;
  type: "daily" | "monthly";
  access?: "free" | "premium";
  points: number;
  created_at?: string;
  expires_at?: string;
  image_url?: string;
  isCompleted: number;
};

export default function MissionsPage() {
  const { t } = useLanguage();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedPoints = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
    if (storedPoints) {
      setUserPoints(Number(storedPoints));
    }

    if (!token) return;

    fetch("/api/user/missions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const missionsData = Array.isArray(data) ? data : [];
        setMissions(missionsData);
        const completed = missionsData.filter((m) => m.isCompleted === 1).length;
        setMissionsCompleted(completed);
        if (typeof window !== "undefined") {
          localStorage.setItem("ecohint-missions-completed", String(completed));
        }
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const handleFileSelect = (missionId: number) => {
    setSelectedMissionId(missionId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMissionId) return;

    setSubmitting(selectedMissionId);

    // Simular upload para URL (em produção, enviar para servidor)
    const reader = new FileReader();
    reader.onload = async () => {
      const photoUrl = reader.result as string;

      try {
        const res = await fetch(
          `/api/user/missions/${selectedMissionId}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ photoUrl }),
          }
        );

        if (res.ok) {
          const payload = await res.json();
          const gainedPoints = Number(payload?.points_awarded || 0);

          if (gainedPoints > 0) {
            setUserPoints((prev) => {
              const next = prev + gainedPoints;
              if (typeof window !== "undefined") {
                localStorage.setItem("ecohint-points", String(next));
              }
              return next;
            });
          }

          alert(`${t("Missão completada!")} (+${gainedPoints} ${t("pontos")})`);
          // Refresh missions
          const updatedRes = await fetch("/api/user/missions", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const updatedData = await updatedRes.json();
          const missionsData = Array.isArray(updatedData) ? updatedData : [];
          setMissions(missionsData);
          const completed = missionsData.filter((m: Mission) => m.isCompleted === 1).length;
          setMissionsCompleted(completed);
          if (typeof window !== "undefined") {
            localStorage.setItem("ecohint-missions-completed", String(completed));
          }
        } else {
          alert(t("Erro ao submeter missão"));
        }
      } catch (err) {
        console.error(err);
        alert(t("Erro ao submeter missão"));
      } finally {
        setSubmitting(null);
        setSelectedMissionId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <p>{t("Carregando missões...")}</p>;

  const filteredMissions = missions.filter(m => m.type === activeTab);

  const missionCardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 15,
    border: "1px solid #e5e7eb",
  };

  const tabButtonStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    backgroundColor: isActive ? "#22c55e" : "#f3f4f6",
    color: isActive ? "#fff" : "#666",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: isActive ? "bold" : "normal",
    marginRight: 10,
  });

  const actionButtonStyle = (disabled?: boolean) => ({
    padding: "8px 16px",
    backgroundColor: disabled ? "#d1d5db" : "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 14,
    marginRight: 8,
  });

  const getAccessBadge = (access?: Mission["access"]) => {
    if (access === "premium") {
      return {
        label: t("Premium"),
        color: "#7c3aed",
        bgColor: "#ede9fe",
      };
    }
    return {
      label: t("Gratuito"),
      color: "#15803d",
      bgColor: "#dcfce7",
    };
  };

  const getStatusBadge = (mission: Mission) => {
    if (!mission.isCompleted) {
      return {
        text: t("Não Completada"),
        color: "#ef4444",
        bgColor: "#fee2e2",
      };
    }
    return {
      text: t("Concluída"),
      color: "#2563eb",
      bgColor: "#dbeafe",
    };
  };

  const getRemainingSeconds = (mission: Mission) => {
    let expiry: Date | null = null;

    if (mission.expires_at) {
      const parsed = new Date(mission.expires_at);
      if (!Number.isNaN(parsed.getTime())) {
        expiry = parsed;
      }
    }

    if (!expiry && mission.created_at) {
      const createdAt = new Date(mission.created_at);
      if (!Number.isNaN(createdAt.getTime())) {
        const fallback = new Date(createdAt);
        if (mission.type === "daily") fallback.setDate(fallback.getDate() + 1);
        else if (mission.type === "monthly") fallback.setMonth(fallback.getMonth() + 1);
        expiry = fallback;
      }
    }

    if (!expiry) return null;

    return Math.max(0, Math.floor((expiry.getTime() - now) / 1000));
  };

  const formatRemaining = (seconds: number | null) => {
    if (seconds === null) return "-";
    if (seconds <= 0) return t("Expirada");

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const availableMissions = filteredMissions.filter((mission) => {
    const remaining = getRemainingSeconds(mission);
    return remaining === null || remaining > 0;
  });

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <h1>{t("Missões")}</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        {t("Complete missões e ganhe pontos EcoHint!")}
      </p>

      {/* Tabs */}
      <div style={{ marginBottom: 30 }}>
        <button
          style={tabButtonStyle(activeTab === "daily")}
          onClick={() => setActiveTab("daily")}
        >
          {t("Missões Diárias")}
        </button>
        <button
          style={tabButtonStyle(activeTab === "monthly")}
          onClick={() => setActiveTab("monthly")}
        >
          {t("Missões Mensais")}
        </button>
      </div>

      {/* Missions List */}
      <div>
        {availableMissions.length === 0 ? (
          <div style={missionCardStyle}>
            <p style={{ textAlign: "center", color: "#999" }}>
              {t("Nenhuma missão disponível neste momento")}
            </p>
          </div>
        ) : (
          availableMissions.map(mission => {
            const status = getStatusBadge(mission);
            const access = getAccessBadge(mission.access);
            const remaining = getRemainingSeconds(mission);
            return (
              <div key={mission.id} style={missionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: 20 }}>
                      {mission.title}
                    </h3>
                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: 14 }}>
                      {mission.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#22c55e" }}>
                          +{mission.points} pts
                        </div>
                        <div
                          style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: "bold",
                            backgroundColor: access.bgColor,
                            color: access.color,
                          }}
                        >
                          {access.label}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "5px 12px",
                          backgroundColor: status.bgColor,
                          color: status.color,
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {status.text}
                      </div>
                      <div
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "#eef2ff",
                          color: "#3730a3",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {t("Tempo restante")}: {formatRemaining(remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginLeft: 20 }}>
                    {!mission.isCompleted ? (
                      <button
                        style={actionButtonStyle()}
                        onClick={() => handleFileSelect(mission.id)}
                        disabled={submitting === mission.id}
                      >
                        {submitting === mission.id ? t("Enviando...") : t("Submeter Foto")}
                      </button>
                    ) : (
                      <button style={actionButtonStyle(true)} disabled>
                        {t("Concluída")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Image */}
                {mission.image_url && (
                  <img
                    src={mission.image_url}
                    alt={mission.title}
                    style={{
                      marginTop: 15,
                      maxWidth: "200px",
                      maxHeight: "150px",
                      borderRadius: 5,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Info Section */}
      <div
        style={{
          marginTop: 40,
          padding: 20,
          backgroundColor: "#f0fdf4",
          borderRadius: 8,
          borderLeft: "4px solid #22c55e",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#15803d" }}>
          {t("Como Funciona")}
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#666" }}>
          <li>{t("Escolha uma missão e clique em Submeter Foto")}</li>
          <li>{t("Tire uma foto como comprovação da missão completada")}</li>
          <li>{t("Os pontos são atribuídos automaticamente após o envio")}</li>
          <li>{t("Acumule pontos e troque por rewards!")}</li>
        </ol>
      </div>
    </div>
  );
}
