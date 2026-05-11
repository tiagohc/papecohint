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
  verification_type?: "photo" | "invoice_kwh_below" | "invoice_kwh_reduce" | "transport_ticket";
  target_kwh?: number | null;
  image_url?: string;
  created_at?: string;
};

function isMissionExpired(mission: Mission): boolean {
  if (!mission.created_at) return false;
  const created = new Date(mission.created_at).getTime();
  if (mission.type === "daily") return Date.now() > created + 24 * 60 * 60 * 1000;
  if (mission.type === "monthly") return Date.now() > created + 30 * 24 * 60 * 60 * 1000;
  return false;
}

type UserMissionPending = {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  title: string;
  points: number;
  photo_url: string;
  completed_at: string;
};

type UserMissionCompletion = {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  mission_id: number;
  title: string;
  points: number;
  verification_type: string;
  photo_url: string;
  verified: number;
  redeemed: number;
  completed_at: string;
};

export default function AdminMissionsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"create" | "list" | "verify" | "history">("list");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [pendingMissions, setPendingMissions] = useState<UserMissionPending[]>([]);
  const [expiredMissions, setExpiredMissions] = useState<(Mission & { expires_at?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<"daily" | "monthly">("daily");
  const [editPoints, setEditPoints] = useState("");
  const [editAccess, setEditAccess] = useState<"free" | "premium">("free");
  const [editVerificationType, setEditVerificationType] = useState<"photo" | "invoice_kwh_below" | "invoice_kwh_reduce" | "transport_ticket">("transport_ticket");
  const [editTargetKwh, setEditTargetKwh] = useState("");

  // Form states
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [missionType, setMissionType] = useState<"daily" | "monthly">("daily");
  const [missionPoints, setMissionPoints] = useState("");
  const [missionAccess, setMissionAccess] = useState<"free" | "premium">("free");
  const [missionVerificationType, setMissionVerificationType] = useState<"photo" | "invoice_kwh_below" | "invoice_kwh_reduce" | "transport_ticket">("transport_ticket");
  const [missionTargetKwh, setMissionTargetKwh] = useState("");
  const [missionImage, setMissionImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Load missions and pending
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [missionsRes, pendingRes, expiredRes] = await Promise.all([
          fetch("/api/admin/missions", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/missions/pending", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/missions/expired", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const mData = await missionsRes.json();
        const pData = await pendingRes.json();
        const eData = await expiredRes.json();
        setMissions(Array.isArray(mData) ? mData : []);
        setPendingMissions(Array.isArray(pData) ? pData : []);
        setExpiredMissions(Array.isArray(eData) ? eData : []);
      } catch (err) { console.error(err); }
    })();
  }, [token]);

  // Reload expired missions every time the history tab becomes active
  useEffect(() => {
    if (activeTab === "history" && token) {
      fetch("/api/admin/missions/expired", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setExpiredMissions(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [activeTab, token]);

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
          verification_type: missionVerificationType,
          target_kwh: missionVerificationType === "invoice_kwh_below" && missionTargetKwh ? Number(missionTargetKwh) : null,
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
        setMissionVerificationType("photo");
        setMissionTargetKwh("");
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

  const handleDuplicateMission = async (missionId: number, missionTitle: string) => {
    if (!token) return;
    if (!confirm(t(`Criar nova cópia de "${missionTitle}" com data de hoje? Ficará disponível imediatamente para todos os utilizadores.`))) return;
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert(t("Missão criada com sucesso! Agora está activa com a data de hoje."));
        const [mData, eData] = await Promise.all([
          fetch("/api/admin/missions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch("/api/admin/missions/expired", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
        setMissions(Array.isArray(mData) ? mData : []);
        setExpiredMissions(Array.isArray(eData) ? eData : []);
      } else {
        alert(t("Erro ao recriar missão"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetCompletion = async (completionId: number) => {
    if (!token) return;
    if (!confirm(t("Remover esta conclusão? O utilizador poderá repetir a missão e os pontos serão revertidos."))) return;

    try {
      const res = await fetch(`/api/admin/missions/completions/${completionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert(t("Conclusão removida. A missão pode ser repetida."));
        const data = await fetch("/api/admin/missions/completions", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        setCompletions(Array.isArray(data) ? data : []);
      } else {
        alert(t("Erro ao fazer reset da missão"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMission = async (id: number, title: string) => {
    if (!token) return;
    if (!confirm(t(`Eliminar a missão "${title}"? Esta ação é irreversível.`))) return;
    try {
      const res = await fetch(`/api/admin/missions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMissions(prev => prev.filter(m => m.id !== id));
      } else {
        alert(t("Erro ao eliminar missão"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setEditTitle(mission.title);
    setEditDescription(mission.description || "");
    setEditType(mission.type);
    setEditPoints(String(mission.points));
    setEditAccess(mission.access);
    setEditVerificationType(mission.verification_type || "photo");
    setEditTargetKwh(mission.target_kwh != null ? String(mission.target_kwh) : "");
  };

  const handleSaveEdit = async () => {
    if (!token || !editingMission) return;
    try {
      const res = await fetch(`/api/admin/missions/${editingMission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          type: editType,
          points: Number(editPoints),
          access: editAccess,
          verification_type: editVerificationType,
          target_kwh: editVerificationType === "invoice_kwh_below" && editTargetKwh ? Number(editTargetKwh) : null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMissions(prev => prev.map(m => m.id === updated.id ? updated : m));
        setEditingMission(null);
      } else {
        alert(t("Erro ao guardar missão"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "var(--bg-card)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const tabButtonStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    backgroundColor: isActive ? "#0f766e" : "var(--bg-secondary, #f3f4f6)",
    color: isActive ? "#fff" : "var(--text-secondary)",
    border: isActive ? "none" : "1px solid var(--border)",
    borderRadius: 8,
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
        <button
          style={tabButtonStyle(activeTab === "history")}
          onClick={() => setActiveTab("history")}
        >
          {t("Histórico")} ({expiredMissions.length})
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

            <select
              value={missionVerificationType}
              onChange={(e) => setMissionVerificationType(e.target.value as "photo" | "invoice_kwh_below" | "invoice_kwh_reduce" | "transport_ticket")}
              style={{ ...adminSelectStyle, width: "100%", marginBottom: 12 }}
            >
              <option value="transport_ticket">{t("Bilhete de Transporte (IA)")}</option>
              <option value="photo">{t("Foto (verificação manual)")}</option>
              <option value="invoice_kwh_below">{t("Fatura: consumo abaixo de X kWh")}</option>
              <option value="invoice_kwh_reduce">{t("Fatura: reduzir consumo vs mês anterior")}</option>
            </select>

            {(missionVerificationType === "invoice_kwh_below" || missionVerificationType === "invoice_kwh_reduce") && (
              <input
                type="number"
                placeholder={missionVerificationType === "invoice_kwh_below" ? t("Limite de kWh (ex: 200)") : t("Referência de redução em kWh (opcional)")}
                value={missionTargetKwh}
                onChange={(e) => setMissionTargetKwh(e.target.value)}
                style={formInputStyle}
                required={missionVerificationType === "invoice_kwh_below"}
              />
            )}

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

          {/* Edit Modal */}
          {editingMission && (
            <div style={{ background: "#f0fdf4", border: "2px solid #22c55e", borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 12px 0" }}>{t("Editar Missão")}: {editingMission.title}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#374151" }}>{t("Título")}</label>
                  <input style={{ ...formInputStyle }} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#374151" }}>{t("Pontos")}</label>
                  <input style={{ ...formInputStyle }} type="number" value={editPoints} onChange={e => setEditPoints(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#374151" }}>{t("Tipo")}</label>
                  <select style={{ ...formInputStyle }} value={editType} onChange={e => setEditType(e.target.value as "daily" | "monthly")}>
                    <option value="daily">{t("Diária")}</option>
                    <option value="monthly">{t("Mensal")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#374151" }}>{t("Acesso")}</label>
                  <select style={{ ...formInputStyle }} value={editAccess} onChange={e => setEditAccess(e.target.value as "free" | "premium")}>
                    <option value="free">{t("Gratuito")}</option>
                    <option value="premium">{t("Premium")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#374151" }}>{t("Tipo de verificação")}</label>
                  <select style={{ ...formInputStyle }} value={editVerificationType} onChange={e => setEditVerificationType(e.target.value as typeof editVerificationType)}>
                    <option value="transport_ticket">{t("Bilhete MobiAzores (IA)")}</option>
                    <option value="photo">{t("Foto (verificação manual)")}</option>
                    <option value="invoice_kwh_below">{t("Fatura: consumo abaixo de X kWh")}</option>
                    <option value="invoice_kwh_reduce">{t("Fatura: reduzir consumo vs mês anterior")}</option>
                  </select>
                </div>
                {(editVerificationType === "invoice_kwh_below" || editVerificationType === "invoice_kwh_reduce") && (
                  <div>
                    <label style={{ fontSize: 13, color: "#374151" }}>{editVerificationType === "invoice_kwh_below" ? t("Limite kWh") : t("Referência kWh")}</label>
                    <input style={{ ...formInputStyle }} type="number" value={editTargetKwh} onChange={e => setEditTargetKwh(e.target.value)} />
                  </div>
                )}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>{t("Descrição")}</label>
                  <textarea style={{ ...formInputStyle, height: 60, resize: "none" }} value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button style={{ ...adminActionPrimaryButtonStyle }} onClick={handleSaveEdit}>{t("Guardar")}</button>
                <button style={{ ...adminActionDangerButtonStyle }} onClick={() => setEditingMission(null)}>{t("Cancelar")}</button>
              </div>
            </div>
          )}

          {(() => {
            const activeMissions = missions.filter(m => !isMissionExpired(m));
            return activeMissions.length === 0 ? (
            <p style={{ color: "#999" }}>{t("Nenhuma missão ativa. As missões expiradas aparecem no Histórico.")}</p>
          ) : (
            <div style={adminTableContainerStyle}>
              <table style={adminTableStyle}>
                <thead>
                  <tr style={adminTableHeadRowStyle}>
                    <th style={adminTableHeaderCellStyle}>{t("Título")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Tipo")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Verificação")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Acesso")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Ações")}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMissions.map((mission, idx) => (
                    <tr key={mission.id} style={adminTableRowStyle(idx)}>
                      <td style={adminTableCellStyle}>{mission.title}</td>
                      <td style={adminTableCellStyle}>{mission.type === "daily" ? t("Diária") : t("Mensal")}</td>
                      <td style={adminTableCellStyle}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: "bold",
                          backgroundColor: mission.verification_type === "transport_ticket" ? "#dbeafe"
                            : mission.verification_type === "invoice_kwh_below" || mission.verification_type === "invoice_kwh_reduce" ? "#d1fae5"
                            : "#f3f4f6",
                          color: mission.verification_type === "transport_ticket" ? "#1d4ed8"
                            : mission.verification_type === "invoice_kwh_below" || mission.verification_type === "invoice_kwh_reduce" ? "#065f46"
                            : "#374151",
                        }}>
                          {mission.verification_type === "transport_ticket" ? t("Bilhete")
                            : mission.verification_type === "invoice_kwh_below" ? "kWh < " + (mission.target_kwh ?? "?")
                            : mission.verification_type === "invoice_kwh_reduce" ? t("Redução")
                            : t("Foto")}
                        </span>
                      </td>
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
                      <td style={adminTableCellStyle}>
                        <button
                          style={{ ...adminActionPrimaryButtonStyle, marginRight: 6, fontSize: 12, padding: "4px 10px" }}
                          onClick={() => openEditMission(mission)}
                        >
                          {t("Editar")}
                        </button>
                        <button
                          style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginRight: 6, fontSize: 12, padding: "4px 10px" }}
                          onClick={() => handleDuplicateMission(mission.id, mission.title)}
                        >
                          {t("Repetir")}
                        </button>
                        <button
                          style={{ ...adminActionDangerButtonStyle, fontSize: 12, padding: "4px 10px" }}
                          onClick={() => handleDeleteMission(mission.id, mission.title)}
                        >
                          {t("Eliminar")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          })()}
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
                      <strong>{t("Utilizador:")}</strong> {pending.user_name} ({pending.email})
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
                      {t("Aprovar")}
                    </button>
                    <button
                      style={adminActionDangerButtonStyle}
                      onClick={() => handleVerifyMission(pending.id, false)}
                    >
                      {t("Rejeitar")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div style={cardStyle}>
          <h2>{t("Histórico de Missões")}</h2>
          <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
            {t("Missões que já expiraram. Clica em 'Repetir' para criar uma nova cópia com a data de hoje.")}
          </p>
          {expiredMissions.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", padding: 40 }}>
              {t("Nenhuma missão expirada")}
            </p>
          ) : (
            <div style={adminTableContainerStyle}>
              <table style={adminTableStyle}>
                <thead>
                  <tr style={adminTableHeadRowStyle}>
                    <th style={adminTableHeaderCellStyle}>{t("Missão")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Tipo")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Verificação")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Pts")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Expirou em")}</th>
                    <th style={adminTableHeaderCellStyle}>{t("Ação")}</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredMissions.map((m, idx) => (
                    <tr key={m.id} style={adminTableRowStyle(idx)}>
                      <td style={adminTableCellStyle}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
                        <div style={{ color: "#9ca3af", fontSize: 11 }}>{m.description?.substring(0, 50)}{m.description?.length > 50 ? "…" : ""}</div>
                      </td>
                      <td style={adminTableCellStyle}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: "bold",
                          backgroundColor: m.type === "daily" ? "#ede9fe" : "#dbeafe",
                          color: m.type === "daily" ? "#5b21b6" : "#1d4ed8",
                        }}>
                          {m.type === "daily" ? t("Diária") : t("Mensal")}
                        </span>
                      </td>
                      <td style={adminTableCellStyle}>
                        <span style={{
                          padding: "2px 6px", borderRadius: 10, fontSize: 11, fontWeight: "bold",
                          backgroundColor: "#f3f4f6", color: "#374151",
                        }}>
                          {m.verification_type === "transport_ticket" ? t("Bilhete") : m.verification_type === "photo" ? t("Foto") : "kWh"}
                        </span>
                      </td>
                      <td style={{ ...adminTableCellStyle, fontWeight: "bold", color: "#22c55e" }}>{m.points}</td>
                      <td style={{ ...adminTableCellStyle, fontSize: 12, color: "#6b7280" }}>
                        {m.expires_at ? new Date(m.expires_at).toLocaleString("pt-PT") : "—"}
                      </td>
                      <td style={adminTableCellStyle}>
                        <button
                          onClick={() => handleDuplicateMission(m.id, m.title)}
                          style={{
                            padding: "4px 12px",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #93c5fd",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {t("Repetir")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
