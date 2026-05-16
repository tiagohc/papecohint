"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
import { fixEncoding } from "@/lib/fixEncoding";
import {
  adminFormGridStyle,
  adminInputStyle,
  adminSelectStyle,
  adminModalBackdropStyle,
  adminModalCardStyle,
} from "../components/formStyles";
import {
  adminTableContainerStyle,
  adminTableStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableCellStyle,
  adminTableRowStyle,
  adminActionDangerButtonStyle,
  adminTopActionButtonStyle,
} from "../components/tableStyles";

type Notification = {
  id: number;
  user_id: number;
  user_name: string;
  title: string;
  message: string;
  type: string;
  read_status: number;
  created_at: string;
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function AdminNotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetUserId, setTargetUserId] = useState<string>("all");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchNotifications = () => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/notifications?ts=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchUsers = () => {
    if (!token) return;
    fetch(`/api/admin/users?ts=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const handleSend = async () => {
    if (!token || !title || !message) return;

    const url =
      targetUserId === "all"
        ? "/api/admin/notifications/send-all"
        : `/api/admin/notifications/send/${targetUserId}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message, type }),
      });

      if (res.ok) {
        setModalOpen(false);
        setTitle("");
        setMessage("");
        setType("info");
        setTargetUserId("all");
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 style={{ marginBottom: 20, fontSize: 24, color: "#1e293b" }}>
        {t("Painel de Admin")} - {t("Notificações")}
      </h1>

      <div style={{ marginBottom: 20 }}>
        <button style={adminTopActionButtonStyle} onClick={() => setModalOpen(true)}>
          {t("Enviar Notificação")}
        </button>
      </div>

      {loading ? (
        <p>{t("Carregando...")}</p>
      ) : (
        <div style={adminTableContainerStyle}>
          <table style={adminTableStyle}>
            <thead>
              <tr style={adminTableHeadRowStyle}>
                <th style={adminTableHeaderCellStyle}>ID</th>
                <th style={adminTableHeaderCellStyle}>{t("Utilizador")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Título")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Mensagem")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Tipo")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Estado")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Data")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Ações")}</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif, idx) => (
                <tr key={notif.id} style={adminTableRowStyle(idx)}>
                  <td style={adminTableCellStyle}>{notif.id}</td>
                  <td style={adminTableCellStyle}>{notif.user_name || `#${notif.user_id}`}</td>
                  <td style={adminTableCellStyle}>{fixEncoding(notif.title)}</td>
                  <td style={adminTableCellStyle}>
                    {fixEncoding(notif.message).length > 50 ? fixEncoding(notif.message).slice(0, 50) + "..." : fixEncoding(notif.message)}
                  </td>
                  <td style={adminTableCellStyle}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor:
                          notif.type === "mission" ? "#dcfce7" :
                          notif.type === "reward" ? "#fef3c7" :
                          notif.type === "system" ? "#dbeafe" :
                          "#f3f4f6",
                        color:
                          notif.type === "mission" ? "#166534" :
                          notif.type === "reward" ? "#92400e" :
                          notif.type === "system" ? "#1e40af" :
                          "#374151",
                      }}
                    >
                      {notif.type}
                    </span>
                  </td>
                  <td style={adminTableCellStyle}>
                    {notif.read_status === 1 ? t("Lida") : t("Não lida")}
                  </td>
                  <td style={adminTableCellStyle}>{formatDate(notif.created_at)}</td>
                  <td style={adminTableCellStyle}>
                    <button style={adminActionDangerButtonStyle} onClick={() => handleDelete(notif.id)}>
                      {t("Deletar")}
                    </button>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...adminTableCellStyle, textAlign: "center", color: "#666" }}>
                    {t("Nenhuma notificação encontrada.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Enviar Notificação */}
      {modalOpen && (
        <div style={adminModalBackdropStyle} onClick={() => setModalOpen(false)}>
          <div style={adminModalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0, fontSize: 18, color: "#1e293b" }}>{t("Enviar Notificação")}</h2>
            <div style={adminFormGridStyle}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{t("Destinatário")}</label>
              <select
                style={adminSelectStyle}
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="all">{t("Todos os utilizadores")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{t("Tipo")}</label>
              <select style={adminSelectStyle} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="info">Info</option>
                <option value="mission">{t("Missão")}</option>
                <option value="reward">{t("Recompensa")}</option>
                <option value="system">{t("Sistema")}</option>
                <option value="reminder">{t("Lembrete")}</option>
              </select>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{t("Título")}</label>
              <input
                style={adminInputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("Título da notificação")}
              />

              <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{t("Mensagem")}</label>
              <textarea
                style={{ ...adminInputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("Mensagem da notificação")}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                style={{
                  ...adminTopActionButtonStyle,
                  opacity: !title || !message ? 0.5 : 1,
                }}
                disabled={!title || !message}
                onClick={handleSend}
              >
                {t("Enviar")}
              </button>
              <button
                style={{
                  padding: "10px 16px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setModalOpen(false)}
              >
                {t("Cancelar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
