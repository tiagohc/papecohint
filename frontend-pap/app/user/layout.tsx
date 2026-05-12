"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserHeader from "./components/UserHeader";
import { useLanguage } from "@/app/components/LanguageProvider";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/pushNotifications";

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    requestNotificationPermission().catch(console.error);
    onForegroundMessage((payload) => {
      if (Notification.permission === "granted" && payload.notification) {
        new Notification(payload.notification.title || "EcoHint", {
          body: payload.notification.body || "",
          icon: "/icons/icon-192x192.png",
        });
      }
      setUnreadCount((c) => c + 1);
    });
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const fetchUnread = () => {
      fetch("/api/user/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setUnreadCount(data.count ?? 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pathname === "/user/notificacoes") setUnreadCount(0);
    setDrawerOpen(false); // fecha drawer ao navegar
  }, [pathname]);

  const menuItems = [
    { name: t("Tela Inicial"), href: "/user" },
    { name: t("Missões"), href: "/user/missions" },
    { name: t("Impacto Ambiental"), href: "/user/impacto-ambiental" },
    { name: t("Loja de Pontos"), href: "/user/loja-pontos" },
    { name: t("Rankings"), href: "/user/rankings" },
    { name: t("Notificações"), href: "/user/notificacoes", badge: unreadCount },
    { name: t("Perfil"), href: "/user/perfil" },
    { name: t("Premium"), href: "/user/premium" },
  ];

  const sidebarContent = (
    <>
      <div style={{ paddingBottom: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700 }}>EcoHint</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{t("Portal Utilizador")}</div>
      </div>
      <div className="section" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="section-title" style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>{t("Menu")}</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            {item.name}
            {"badge" in item && item.badge && item.badge > 0 ? (
              <span style={{
                minWidth: 20, height: 20, borderRadius: 999,
                backgroundColor: "#ef4444", color: "#fff",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px",
              }}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 18px" }}>
        {sidebarContent}
      </aside>

      {/* Overlay mobile quando drawer está aberto */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 998, display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Drawer mobile */}
      <aside
        className="mobile-drawer"
        style={{
          position: "fixed", top: 0, left: drawerOpen ? 0 : "-280px",
          width: 260, height: "100vh",
          background: "linear-gradient(180deg, #1b5e20, #2e7d32)",
          color: "white", zIndex: 999,
          transition: "left 0.3s ease",
          display: "none",
          flexDirection: "column", gap: 24, padding: "24px 18px",
          overflowY: "auto",
        }}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            alignSelf: "flex-end", background: "none", border: "none",
            color: "white", fontSize: 24, cursor: "pointer", padding: 0,
          }}
        >✕</button>
        {sidebarContent}
      </aside>

      <div className="admin-content-wrapper" style={{ minHeight: "100vh" }}>
        <UserHeader onMenuClick={() => setDrawerOpen(true)} />
        <main style={{ padding: 30 }}>{children}</main>
      </div>
    </>
  );
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    requestNotificationPermission().catch(console.error);

    onForegroundMessage((payload) => {
      // Quando a app está aberta, o FCM não mostra a notificação automaticamente.
      // Criamos manualmente e incrementamos o badge da sidebar.
      if (Notification.permission === "granted" && payload.notification) {
        new Notification(payload.notification.title || "EcoHint", {
          body: payload.notification.body || "",
          icon: "/icons/icon-192x192.png",
        });
      }
      // bump badge when a foreground message arrives
      setUnreadCount((c) => c + 1);
    });
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const fetchUnread = () => {
      fetch("/api/user/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setUnreadCount(data.count ?? 0))
        .catch(() => {});
    };
    fetchUnread();
    // Polling a cada 30s para manter o badge de não-lidas actualizado em background.
    // Não usamos WebSocket para simplificar — 30s é suficiente para UX.
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // reset badge when user visits notifications page
  useEffect(() => {
    if (pathname === "/user/notificacoes") setUnreadCount(0);
  }, [pathname]);

  const menuItems = [
    { name: t("Tela Inicial"), href: "/user" },
    { name: t("Missões"), href: "/user/missions" },
    { name: t("Impacto Ambiental"), href: "/user/impacto-ambiental" },
    { name: t("Loja de Pontos"), href: "/user/loja-pontos" },
    { name: t("Rankings"), href: "/user/rankings" },
    { name: t("Notificações"), href: "/user/notificacoes", badge: unreadCount },
    { name: t("Perfil"), href: "/user/perfil" },
    { name: t("Premium"), href: "/user/premium" },
  ];

  return (
    <>
      <aside className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 18px" }}>
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>EcoHint</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{t("Portal Utilizador")}</div>
        </div>

        <div className="section" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="section-title" style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
            {t("Menu")}
          </p>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`item ${pathname === item.href ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              {item.name}
              {"badge" in item && item.badge && item.badge > 0 ? (
                <span style={{
                  minWidth: 20, height: 20, borderRadius: 999,
                  backgroundColor: "#ef4444", color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 5px",
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </aside>

      {/* Bottom nav — só visível em mobile */}
      <nav className="mobile-bottom-nav" style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#1b5e20",
        borderTop: "1px solid rgba(255,255,255,0.15)",
        zIndex: 1000,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: "0 0 auto",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "8px 14px",
              color: pathname === item.href ? "#86efac" : "rgba(255,255,255,0.75)",
              textDecoration: "none",
              fontSize: 10,
              fontWeight: pathname === item.href ? 700 : 400,
              borderTop: pathname === item.href ? "2px solid #86efac" : "2px solid transparent",
              position: "relative",
              minWidth: 60,
            }}
          >
            {item.name}
            {"badge" in item && item.badge && item.badge > 0 ? (
              <span style={{
                position: "absolute", top: 4, right: 8,
                minWidth: 16, height: 16, borderRadius: 999,
                backgroundColor: "#ef4444", color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
              }}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="admin-content-wrapper" style={{ minHeight: "100vh" }}>
        <UserHeader />
        <main style={{ padding: 30 }}>{children}</main>
      </div>
    </>
  );
}
