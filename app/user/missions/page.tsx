"use client";

import { useEffect, useState, useRef } from "react";
import { getLevelFromPoints } from "@/lib/progress";

type Mission = {
  id: number;
  title: string;
  description: string;
  type: "daily" | "monthly";
  points: number;
  image_url?: string;
  isCompleted: number;
  verified?: number;
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const storedPoints = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
    if (storedPoints) {
      setUserPoints(Number(storedPoints));
    }

    if (!token) return;

    fetch("http://localhost:8000/admin/missions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const missionsData = Array.isArray(data) ? data : [];
        setMissions(missionsData);
        const completed = missionsData.filter((m) => m.verified === 1).length;
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
          `http://localhost:8000/admin/missions/${selectedMissionId}/complete`,
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
          alert("Missão submetida para verificação! Aguarde aprovação do admin.");
          // Refresh missions
          const updatedRes = await fetch("http://localhost:8000/admin/missions", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const updatedData = await updatedRes.json();
          setMissions(Array.isArray(updatedData) ? updatedData : []);
        } else {
          alert("Erro ao submeter missão");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao submeter missão");
      } finally {
        setSubmitting(null);
        setSelectedMissionId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRedeem = async (missionId: number) => {
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:8000/admin/missions/${missionId}/redeem`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const gainedPoints = data?.points ?? 0;

        setUserPoints((prev) => {
          const next = prev + gainedPoints;
          if (typeof window !== "undefined") {
            localStorage.setItem("ecohint-points", String(next));
          }
          return next;
        });

        alert(`Pontos resgatados com sucesso! (+${gainedPoints} points)`);
        const updatedRes = await fetch("http://localhost:8000/admin/missions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedData = await updatedRes.json();
        const missionsData = Array.isArray(updatedData) ? updatedData : [];
        setMissions(missionsData);
        const completed = missionsData.filter((m) => m.verified === 1).length;
        setMissionsCompleted(completed);
        if (typeof window !== "undefined") {
          localStorage.setItem("ecohint-missions-completed", String(completed));
        }
      } else {
        alert("Erro ao resgatar pontos");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Carregando missões...</p>;

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

  const getDifficultyBadge = (points: number) => {
    if (points <= 50) {
      return {
        label: "Fácil",
        color: "#16a34a",
        bgColor: "#dcfce7",
      };
    }
    if (points <= 150) {
      return {
        label: "Médio",
        color: "#f59e0b",
        bgColor: "#fef9c3",
      };
    }
    return {
      label: "Difícil",
      color: "#dc2626",
      bgColor: "#fee2e2",
    };
  };

  const getStatusBadge = (mission: Mission) => {
    if (!mission.isCompleted) {
      return {
        text: "Não Completada",
        color: "#ef4444",
        bgColor: "#fee2e2",
      };
    }
    if (mission.verified) {
      return {
        text: "Verificada",
        color: "#22c55e",
        bgColor: "#f0fdf4",
      };
    }
    return {
      text: "Pendente Verificação",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    };
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Missões</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Complete missões e ganhe pontos EcoHint!
      </p>

      {/* Tabs */}
      <div style={{ marginBottom: 30 }}>
        <button
          style={tabButtonStyle(activeTab === "daily")}
          onClick={() => setActiveTab("daily")}
        >
          Missões Diárias
        </button>
        <button
          style={tabButtonStyle(activeTab === "monthly")}
          onClick={() => setActiveTab("monthly")}
        >
          Missões Mensais
        </button>
      </div>

      {/* Missions List */}
      <div>
        {filteredMissions.length === 0 ? (
          <div style={missionCardStyle}>
            <p style={{ textAlign: "center", color: "#999" }}>
              Nenhuma missão disponível neste momento
            </p>
          </div>
        ) : (
          filteredMissions.map(mission => {
            const status = getStatusBadge(mission);
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
                            backgroundColor: getDifficultyBadge(mission.points).bgColor,
                            color: getDifficultyBadge(mission.points).color,
                          }}
                        >
                          {getDifficultyBadge(mission.points).label}
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
                        {submitting === mission.id ? "Enviando..." : "Submeter Foto"}
                      </button>
                    ) : mission.verified ? (
                      <button
                        style={actionButtonStyle()}
                        onClick={() => handleRedeem(mission.id)}
                      >
                        Resgatar Pontos
                      </button>
                    ) : (
                      <button style={actionButtonStyle(true)} disabled>
                        ⏳ Aguardando Verificação
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
          Como Funciona
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#666" }}>
          <li>Escolha uma missão e clique em "Submeter Foto"</li>
          <li>Tire uma foto como comprovação da missão completada</li>
          <li>Aguarde a verificação do administrador</li>
          <li>Quando aprovada, resgate seus pontos EcoHint</li>
          <li>Acumule pontos e troque por rewards!</li>
        </ol>
      </div>
    </div>
  );
}
