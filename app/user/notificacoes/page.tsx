"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "mission" | "reward" | "system" | "reminder";
  isRead: boolean;
  createdAt: string;
};

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sem notificações iniciais até o backend fornecer dados reais
    setNotifications([]);
    setLoading(false);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mission":
        return "Missão";
      case "reward":
        return "Recompensa";
      case "system":
        return "Sistema";
      case "reminder":
        return "Lembrete";
      default:
        return "Notificação";
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

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} h atrás`;
    return `${diffDays} dias atrás`;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  if (loading) return <p>Carregando notificações...</p>;

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>Notificações</h1>
        <p style={{ margin: "8px 0 0 0", color: "#666" }}>
          Fique por dentro das últimas atualizações, missões aprovadas e lembretes.
        </p>
        {unreadCount > 0 && (
          <p style={{ margin: "10px 0 0 0", color: "#22c55e", fontWeight: "bold" }}>
            Você tem {unreadCount} notificação(ões) não lida(s).
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
            Marcar todas como lidas
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 18px 0" }}>Todas as notificações</h2>

        {notifications.length === 0 ? (
          <p style={{ color: "#666" }}>Nenhuma notificação disponível.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: notif.isRead ? "#f9fafb" : "#e0f2f1",
                  border: notif.isRead ? "1px solid #e5e7eb" : "1px solid #22c55e",
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
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {getTypeIcon(notif.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }}>
                      {notif.title}
                    </h3>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "#444", fontSize: 14 }}>
                    {notif.message}
                  </p>
                  {!notif.isRead && (
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
                      Marcar como lida
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
