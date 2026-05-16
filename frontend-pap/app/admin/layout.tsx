
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";
import {
  Users, Handshake, Package, Target, Bell, BarChart2, Settings, LogOut, Menu, X,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [adminName, setAdminName] = useState("");

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
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setAdminName(data.name || data.email || ""))
      .catch(() => {});
    const fetchPending = () => {
      if (document.hidden) return;
      fetch("/api/admin/rewards/pending", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => { if (!r.ok) return null; return r.json(); })
        .then((data) => { if (data) setPendingCount(Array.isArray(data) ? data.length : 0); })
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setTheme("light");
    localStorage.removeItem("theme");
    localStorage.removeItem("token");
    router.push("/");
  };

  const menuItems = [
    { name: t("Utilizadores"), href: "/admin/users", icon: <Users size={18} /> },
    { name: t("Parceiros"), href: "/admin/partners", icon: <Handshake size={18} /> },
    {
      name: (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {t("Produtos")}
          {pendingCount > 0 && (
            <span style={{
              minWidth: 16, height: 16, borderRadius: 999,
              backgroundColor: "#ef4444", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}>{pendingCount}</span>
          )}
        </span>
      ),
      href: "/admin/rewards", icon: <Package size={18} />,
    },
    { name: t("Missões"), href: "/admin/missions", icon: <Target size={18} /> },
    { name: t("Notificações"), href: "/admin/notifications", icon: <Bell size={18} /> },
    { name: t("Relatórios"), href: "/admin/reports", icon: <BarChart2 size={18} /> },
    { name: t("Definições"), href: "/admin/settings", icon: <Settings size={18} /> },
  ];

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
      <div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>EcoHint</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{adminName}</div>
        </div>
        <div>
          <p style={{ margin: "0 0 10px 0", fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{t("Ferramentas Admin")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0, opacity: 0.9 }}>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8,
            background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)",
            color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600,
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
        <div onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 998 }} />
      )}

      {isMobile && (
        <aside style={{
          position: "fixed", top: 0, left: drawerOpen ? 0 : "-280px",
          width: 260, height: "100vh",
          background: "linear-gradient(180deg, #1b5e20, #2e7d32)",
          color: "white", zIndex: 999, transition: "left 0.3s ease",
          display: "flex", flexDirection: "column", padding: "24px 18px", overflowY: "auto",
        }}>
          <button onClick={() => setDrawerOpen(false)}
            style={{ alignSelf: "flex-end", background: "none", border: "none", color: "white", cursor: "pointer", padding: 0, marginBottom: 16 }}
          ><X size={22} /></button>
          {sidebarContent}
        </aside>
      )}

      <div className="admin-content-wrapper" style={{ minHeight: "100vh" }}>
        {isMobile && (
          <div style={{ backgroundColor: "#2e7d32", color: "white", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setDrawerOpen(true)}
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
