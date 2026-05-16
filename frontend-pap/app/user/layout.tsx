"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/pushNotifications";
import {
  Home, Target, Leaf, ShoppingCart, Star, Settings,
  Bell, User, LogOut, Menu, X,
} from "lucide-react";

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const fetchUser = () => {
      fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setUserName(data.name || data.email || ""))
        .catch(() => {});
    };
    fetchUser();
    window.addEventListener("profile-updated", fetchUser);
    return () => window.removeEventListener("profile-updated", fetchUser);
  }, []);

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
      if (document.hidden) return;
      fetch("/api/user/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => { if (!r.ok) return null; return r.json(); })
        .then((data) => { if (data) setUnreadCount(data.count ?? 0); })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pathname === "/user/notificacoes") setUnreadCount(0);
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setTheme("light");
    localStorage.removeItem("theme");
    localStorage.removeItem("token");
    router.push("/");
  };

  const menuItems = [
    { name: t("Tela Inicial"), href: "/user", icon: <Home size={18} /> },
    { name: t("Missões"), href: "/user/missions", icon: <Target size={18} /> },
    { name: t("Impacto Ambiental"), href: "/user/impacto-ambiental", icon: <Leaf size={18} /> },
    { name: t("Loja de Pontos"), href: "/user/loja-pontos", icon: <ShoppingCart size={18} /> },
    { name: t("Premium"), href: "/user/premium", icon: <Star size={18} /> },
    {
      name: (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {t("Notificações")}
          {unreadCount > 0 && (
            <span style={{
              minWidth: 16, height: 16, borderRadius: 999,
              backgroundColor: "#ef4444", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}>{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </span>
      ),
      href: "/user/notificacoes", icon: <Bell size={18} />,
    },
    { name: t("Perfil"), href: "/user/perfil", icon: <User size={18} /> },
    { name: t("Definições"), href: "/user/settings", icon: <Settings size={18} /> },
  ];

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
      {/* Top section */}
      <div>
        {/* Brand */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>EcoHint</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{userName}</div>
        </div>

        {/* Menu items */}
        <div>
          <p style={{ margin: "0 0 10px 0", fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{t("Menu")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`item ${pathname === item.href ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0, opacity: 0.9 }}>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: logout */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.18)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <LogOut size={16} />
          {t("Logout")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {!isMobile && (
        <aside className="sidebar" style={{ display: "flex", flexDirection: "column", padding: "24px 18px" }}>
          {sidebarContent}
        </aside>
      )}

      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 998 }}
        />
      )}

      {isMobile && (
        <aside
          style={{
            position: "fixed", top: 0, left: drawerOpen ? 0 : "-280px",
            width: 260, height: "100vh",
            background: "linear-gradient(180deg, #1b5e20, #2e7d32)",
            color: "white", zIndex: 999,
            transition: "left 0.3s ease",
            padding: "24px 18px",
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", marginBottom: 16, display: "block", marginLeft: "auto", padding: 4 }}
          ><X size={22} /></button>
          {sidebarContent}
        </aside>
      )}

      <div className="admin-content-wrapper" style={{ minHeight: "100vh" }}>
        {isMobile && (
          <div style={{
            backgroundColor: "#2e7d32", color: "white",
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0, display: "flex" }}
            ><Menu size={24} /></button>
            <span style={{ fontWeight: 700, fontSize: 16 }}>EcoHint</span>
            <div style={{ width: 24 }} />
          </div>
        )}
        <main style={{ padding: isMobile ? 12 : 30 }}>{children}</main>
      </div>
    </>
  );
}
