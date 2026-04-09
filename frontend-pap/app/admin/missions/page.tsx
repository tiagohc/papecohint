"use client";

import { useEffect, useState } from "react";
import {
  adminFormCardStyle,
  adminInputStyle,
  adminSelectStyle,
  adminTextareaStyle,
} from "../components/formStyles";
import {
  adminActionDangerButtonStyle,
  adminActionPrimaryButtonStyle,
  adminTopActionButtonStyle,
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
} from "../components/tableStyles";
import { useLanguage } from "@/app/components/LanguageProvider";

type Mission = {
  id: number;
  title: string;
  description: string;
  type: "daily" | "monthly";
  points: number;
  access: "free" | "premium";
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"create" | "list" | "verify">("create");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [pendingMissions, setPendingMissions] = useState<UserMissionPending[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [missionType, setMissionType] = useState<"daily" | "monthly">("daily");
  const [missionPoints, setMissionPoints] = useState("");
  const [missionAccess, setMissionAccess] = useState<"free" | "premium">("free");
  const [missionImage, setMissionImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Load missions and pending
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [missionsRes, pendingRes] = await Promise.all([
          fetch("/api/admin/missions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/missions/pending", {
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
      alert(t("Preenche os campos obrigatórios"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/missions", {
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
          access: missionAccess,
          imageUrl: missionImage,
        }),
      });

      if (res.ok) {
        alert(t("Missão criada com sucesso!"));
        setMissionTitle("");
        setMissionDescription("");
        setMissionType("daily");
        setMissionPoints("");
        setMissionAccess("free");
        setMissionImage("");
        setActiveTab("list");

        // Reload missions
        const data = await fetch("/api/admin/missions", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        setMissions(Array.isArray(data) ? data : []);
      } else {
        alert(t("Erro ao criar missão"));
      }
    } catch (err) {
      console.error(err);
      alert(t("Erro ao criar missão"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyMission = async (userMissionId: number, approved: boolean) => {
    if (!token) return;

    try {
      const res = await fetch(
        `/api/admin/missions/${userMissionId}/verify`,
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
        alert(approved ? t("Missão aprovada!") : t("Missão rejeitada!"));
        // Reload pending
        const data = await fetch("/api/admin/missions/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        setPendingMissions(Array.isArray(data) ? data : []);
      } else {
        alert(t("Erro ao verificar missão"));
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
    ...adminInputStyle,
    width: "100%",
    marginBottom: 12,
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>{t("Gerenciar Missões")}</h1>

      {/* Tabs */}
      <div style={{ marginBottom: 30 }}>
        <button
          style={tabButtonStyle(activeTab === "create")}
          onClick={() => setActiveTab("create")}
        >
          {t("Criar Missão")}
        </button>
        <button
          style={tabButtonStyle(activeTab === "list")}
          onClick={() => setActiveTab("list")}
        >
          {t("Ver Missões")}
        </button>
        <button
          style={tabButtonStyle(activeTab === "verify")}
          onClick={() => setActiveTab("verify")}
        >
          {t("Verificar Submissões")} ({pendingMissions.length})
        </button>
      </div>

      {/* CREATE MISSION TAB */}
      {activeTab === "create" && (
        <div style={{ ...cardStyle, ...adminFormCardStyle }}>
          <h2>{t("Criar Nova Missão")}</h2>
          <form onSubmit={handleCreateMission}>
            <input
              type="text"
              placeholder={t("Título da Missão *")}
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              style={formInputStyle}
              required
            />

            <textarea
              placeholder={t("Descrição")}
              value={missionDescription}
              onChange={(e) => setMissionDescription(e.target.value)}
              style={{ ...adminTextareaStyle, width: "100%", marginBottom: 12 }}
            />

            <select
              value={missionType}
              onChange={(e) => setMissionType(e.target.value as "daily" | "monthly")}
              style={{ ...adminSelectStyle, width: "100%", marginBottom: 12 }}
            >
              <option value="daily">{t("Missão Diária")}</option>
              <option value="monthly">{t("Missão Mensal")}</option>
            </select>

            <input
              type="number"
              placeholder={t("Pontos a Ganhar *")}
              value={missionPoints}
              onChange={(e) => setMissionPoints(e.target.value)}
              style={formInputStyle}
              required
            />

            <select
              value={missionAccess}
              onChange={(e) => setMissionAccess(e.target.value as "free" | "premium")}
              style={{ ...adminSelectStyle, width: "100%", marginBottom: 12 }}
            >
              <option value="free">{t("Acesso Gratuito")}</option>
              <option value="premium">{t("Apenas Premium")}</option>
            </select>

            <input
              type="text"
              placeholder={t("URL da Imagem (opcional)")}
              value={missionImage}
              onChange={(e) => setMissionImage(e.target.value)}
              style={formInputStyle}
            />

            <button
              type="submit"
              style={adminTopActionButtonStyle}
              disabled={submitting}
            >
              {submitting ? t("Criando...") : t("Criar Missão")}
            </button>
          </form>
        </div>
      )}

      {/* LIST MISSIONS TAB */}
      {activeTab === "list" && (
        <div style={cardStyle}>
          <h2>{t("Missões Existentes")}</h2>
          {missions.length === 0 ? (
            <p style={{ color: "#999" }}>{t("Nenhuma missão criada ainda")}</p>
          ) : (
            <div style={adminTableContainerStyle}>
              <table style={adminTableStyle}>
                <thead>
                  <tr style={adminTableHeadRowStyle}>
                    <th style={adminTableHeaderCellStyle}>{t("Título")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Tipo")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Acesso")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Descrição")}</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((mission, idx) => (
                    <tr key={mission.id} style={adminTableRowStyle(idx)}>
                      <td style={adminTableCellStyle}>{mission.title}</td>
                      <td style={adminTableCellStyle}>{mission.type === "daily" ? t("Diária") : t("Mensal")}</td>
                      <td style={adminTableCellStyle}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: "bold",
                          backgroundColor: mission.access === "premium" ? "#fef3c7" : "#d1fae5",
                          color: mission.access === "premium" ? "#92400e" : "#065f46",
                        }}>
                          {mission.access === "premium" ? t("Premium") : t("Gratuito")}
                        </span>
                      </td>
                      <td style={{ ...adminTableCellStyle, fontWeight: "bold", color: "#22c55e" }}>
                        {mission.points}
                      </td>
                      <td style={adminTableCellStyle}>{mission.description?.substring(0, 50)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VERIFY MISSIONS TAB */}
      {activeTab === "verify" && (
        <div style={cardStyle}>
          <h2>{t("Verificar Submissões de Missões")}</h2>
          {pendingMissions.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", padding: 40 }}>
              {t("Nenhuma missão pendente de verificação")}
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
                      <strong>{t("Utilizador:")}</strong> {pending.email}
                    </p>
                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: 12 }}>
                      <strong>{t("Pontos:")}</strong> {pending.points} | <strong>{t("Submetido em:")}</strong>{" "}
                      {new Date(pending.completed_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Photo */}
                  {pending.photo_url && (
                    <img
                      src={pending.photo_url}
                      alt={t("Comprovação")}
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
                      style={{ ...adminActionPrimaryButtonStyle, marginRight: 8 }}
                      onClick={() => handleVerifyMission(pending.id, true)}
                    >
                      ✅ {t("Aprovar")}
                    </button>
                    <button
                      style={adminActionDangerButtonStyle}
                      onClick={() => handleVerifyMission(pending.id, false)}
                    >
                      ❌ {t("Rejeitar")}
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
