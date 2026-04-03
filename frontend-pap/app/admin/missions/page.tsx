"use client";

import { useEffect, useState } from "react";

type Mission = {
  id: number;
  title: string;
  description: string;
  type: "daily" | "monthly";
  points: number;
  image_url?: string;
};

type UserMissionPending = {
  id: number;
  user_id: number;
  email: string;
  title: string;
  points: number;
  photo_url: string;
  completed_at: string;
};

export default function AdminMissionsPage() {
  const [activeTab, setActiveTab] = useState<"create" | "list" | "verify">("create");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [pendingMissions, setPendingMissions] = useState<UserMissionPending[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [missionType, setMissionType] = useState<"daily" | "monthly">("daily");
  const [missionPoints, setMissionPoints] = useState("");
  const [missionImage, setMissionImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Load missions and pending
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [missionsRes, pendingRes] = await Promise.all([
          fetch("http://localhost:8000/admin/missions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/admin/missions/admin/pending", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const missionsData = await missionsRes.json();
        const pendingData = await pendingRes.json();

        setMissions(Array.isArray(missionsData) ? missionsData : []);
        setPendingMissions(Array.isArray(pendingData) ? pendingData : []);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [token]);

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!missionTitle || !missionPoints) {
      alert("Preenche os campos obrigatórios");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/admin/missions/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: missionTitle,
          description: missionDescription,
          type: missionType,
          points: Number(missionPoints),
          imageUrl: missionImage,
        }),
      });

      if (res.ok) {
        alert("Missão criada com sucesso!");
        setMissionTitle("");
        setMissionDescription("");
        setMissionType("daily");
        setMissionPoints("");
        setMissionImage("");
        setActiveTab("list");

        // Reload missions
        const data = await fetch("http://localhost:8000/admin/missions", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        setMissions(Array.isArray(data) ? data : []);
      } else {
        alert("Erro ao criar missão");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar missão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyMission = async (userMissionId: number, approved: boolean) => {
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:8000/admin/missions/admin/${userMissionId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approved }),
        }
      );

      if (res.ok) {
        alert(approved ? "Missão aprovada!" : "Missão rejeitada!");
        // Reload pending
        const data = await fetch("http://localhost:8000/admin/missions/admin/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        setPendingMissions(Array.isArray(data) ? data : []);
      } else {
        alert("Erro ao verificar missão");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const tabButtonStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    backgroundColor: isActive ? "#3b82f6" : "#f3f4f6",
    color: isActive ? "#fff" : "#666",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: isActive ? "bold" : "normal",
    marginRight: 10,
  });

  const formInputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: 15,
    border: "1px solid #ddd",
    borderRadius: 5,
    fontFamily: "inherit",
    fontSize: 14,
  };

  const submitButtonStyle = {
    padding: "10px 20px",
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: "bold",
  };

  const approveButtonStyle = {
    padding: "8px 16px",
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginRight: 8,
  };

  const rejectButtonStyle = {
    padding: "8px 16px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Gerenciar Missões</h1>

      {/* Tabs */}
      <div style={{ marginBottom: 30 }}>
        <button
          style={tabButtonStyle(activeTab === "create")}
          onClick={() => setActiveTab("create")}
        >
          Criar Missão
        </button>
        <button
          style={tabButtonStyle(activeTab === "list")}
          onClick={() => setActiveTab("list")}
        >
          Ver Missões
        </button>
        <button
          style={tabButtonStyle(activeTab === "verify")}
          onClick={() => setActiveTab("verify")}
        >
          Verificar Submissões ({pendingMissions.length})
        </button>
      </div>

      {/* CREATE MISSION TAB */}
      {activeTab === "create" && (
        <div style={cardStyle}>
          <h2>Criar Nova Missão</h2>
          <form onSubmit={handleCreateMission}>
            <input
              type="text"
              placeholder="Título da Missão *"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              style={formInputStyle}
              required
            />

            <textarea
              placeholder="Descrição"
              value={missionDescription}
              onChange={(e) => setMissionDescription(e.target.value)}
              style={{ ...formInputStyle, height: 100, fontFamily: "inherit" }}
            />

            <select
              value={missionType}
              onChange={(e) => setMissionType(e.target.value as "daily" | "monthly")}
              style={formInputStyle}
            >
              <option value="daily">Missão Diária</option>
              <option value="monthly">Missão Mensal</option>
            </select>

            <input
              type="number"
              placeholder="Pontos a Ganhar *"
              value={missionPoints}
              onChange={(e) => setMissionPoints(e.target.value)}
              style={formInputStyle}
              required
            />

            <input
              type="text"
              placeholder="URL da Imagem (opcional)"
              value={missionImage}
              onChange={(e) => setMissionImage(e.target.value)}
              style={formInputStyle}
            />

            <button
              type="submit"
              style={submitButtonStyle}
              disabled={submitting}
            >
              {submitting ? "Criando..." : "Criar Missão"}
            </button>
          </form>
        </div>
      )}

      {/* LIST MISSIONS TAB */}
      {activeTab === "list" && (
        <div style={cardStyle}>
          <h2>Missões Existentes</h2>
          {missions.length === 0 ? (
            <p style={{ color: "#999" }}>Nenhuma missão criada ainda</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    Título
                  </th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    Tipo
                  </th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    Pontos
                  </th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody>
                {missions.map((mission) => (
                  <tr key={mission.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                      {mission.title}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                      {mission.type === "daily" ? "Diária" : "Mensal"}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #ddd", fontWeight: "bold", color: "#22c55e" }}>
                      {mission.points}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                      {mission.description?.substring(0, 50)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VERIFY MISSIONS TAB */}
      {activeTab === "verify" && (
        <div style={cardStyle}>
          <h2>Verificar Submissões de Missões</h2>
          {pendingMissions.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", padding: 40 }}>
              Nenhuma missão pendente de verificação
            </p>
          ) : (
            <div>
              {pendingMissions.map((pending) => (
                <div
                  key={pending.id}
                  style={{
                    padding: 15,
                    marginBottom: 15,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <div style={{ marginBottom: 15 }}>
                    <h3 style={{ margin: "0 0 5px 0" }}>{pending.title}</h3>
                    <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: 12 }}>
                      <strong>Utilizador:</strong> {pending.email}
                    </p>
                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: 12 }}>
                      <strong>Pontos:</strong> {pending.points} | <strong>Submetido em:</strong>{" "}
                      {new Date(pending.completed_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Photo */}
                  {pending.photo_url && (
                    <img
                      src={pending.photo_url}
                      alt="Comprovação"
                      style={{
                        maxWidth: "300px",
                        maxHeight: "300px",
                        borderRadius: 5,
                        marginBottom: 15,
                      }}
                    />
                  )}

                  {/* Action Buttons */}
                  <div>
                    <button
                      style={approveButtonStyle}
                      onClick={() => handleVerifyMission(pending.id, true)}
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      style={rejectButtonStyle}
                      onClick={() => handleVerifyMission(pending.id, false)}
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
