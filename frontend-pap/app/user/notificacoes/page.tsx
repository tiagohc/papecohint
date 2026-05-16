"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
import { fixEncoding } from "@/lib/fixEncoding";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  read_status: number;
  created_at: string;
};

export default function NotificacoesPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchNotifications = () => {
    if (!token) return;
    fetch("/api/user/notifications", {
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

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = (id: number) => {
    if (!token) return;
    fetch(`/api/user/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read_status: 1 } : notif
          )
        );
      })
      .catch(console.error);
  };

  const markAllAsRead = () => {
    if (!token) return;
    fetch("/api/user/notifications/read-all", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read_status: 1 }))
        );
      })
      .catch(console.error);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mission": return "🎯";
      case "reward": return "🎁";
      case "system": return "⚙️";
      case "reminder": return "🔔";
      default: return "📢";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mission":
        return "#22c55e";
      case "reward":
        return "#f59e0b";
      case "system":
        return "#3b82f6";
      case "reminder":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} ${t("min atrás")}`;
    if (diffHours < 24) return `${diffHours} ${t("h atrás")}`;
    return `${diffDays} ${t("dias atrás")}`;
  };

  const unreadCount = notifications.filter((n) => n.read_status === 0).length;

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  if (loading) return <p>{t("Carregando notificações...")}</p>;

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>{t("Notificações")}</h1>
        <p style={{ margin: "8px 0 0 0", color: "#666" }}>
          {t("Fique por dentro das últimas atualizações, missões aprovadas e lembretes.")}
        </p>
        {unreadCount > 0 && (
          <p style={{ margin: "10px 0 0 0", color: "#22c55e", fontWeight: "bold" }}>
            {unreadCount} {t("notificação(ões) não lida(s).")}
          </p>
        )}
      </div>

      {unreadCount > 0 && (
        <div style={cardStyle}>
          <button
            onClick={markAllAsRead}
            style={{
              padding: "10px 18px",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("Marcar todas como lidas")}
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 18px 0" }}>{t("Todas as notificações")}</h2>

        {notifications.length === 0 ? (
          <p style={{ color: "#666" }}>{t("Nenhuma notificação disponível.")}</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: notif.read_status === 1 ? "#f9fafb" : "#e0f2f1",
                  border: notif.read_status === 1 ? "1px solid #e5e7eb" : "1px solid #22c55e",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: getTypeColor(notif.type),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  {getTypeIcon(notif.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }}>
                      {fixEncoding(notif.title)}
                    </h3>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "#444", fontSize: 14 }}>
                    {fixEncoding(notif.message)}
                  </p>
                  {notif.read_status === 0 && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      style={{
                        marginTop: 8,
                        padding: "6px 12px",
                        backgroundColor: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {t("Marcar como lida")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
