
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminHeader from "./components/AdminHeader";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const fetchPending = () => {
      if (document.hidden) return;
      fetch("/api/admin/rewards/pending", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => { if (!r.ok) return null; return r.json(); })
        .then((data) => { if (data) setPendingCount(Array.isArray(data) ? data.length : 0); })
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const menuItems = [
    { name: t("Utilizadores"), href: "/admin/users" },
    { name: t("Parceiros"), href: "/admin/partners" },
    { name: t("Produtos"), href: "/admin/rewards", badge: pendingCount },
    { name: t("Missões"), href: "/admin/missions" },
    { name: t("Notificações"), href: "/admin/notifications" },
    { name: t("Relatórios"), href: "/admin/reports" },
  ];

  const sidebarContent = (
    <>
      <div style={{ paddingBottom: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700 }}>EcoHint</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{t("Portal Admin")}</div>
      </div>
      <div className="section" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="section-title" style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          {t("Ferramentas Admin")}
        </p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            {item.name}
            {item.badge && item.badge > 0 ? (
              <span style={{
                minWidth: 20, height: 20, borderRadius: 999,
                backgroundColor: "#ef4444", color: "#fff",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px",
              }}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <>
      {!isMobile && (
        <aside className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 18px" }}>
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
            display: "flex",
            flexDirection: "column", gap: 24, padding: "24px 18px",
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ alignSelf: "flex-end", background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer", padding: 0 }}
          >✕</button>
          {sidebarContent}
        </aside>
      )}

      <div className="admin-content-wrapper" style={{ minHeight: "100vh" }}>
        <AdminHeader onMenuClick={isMobile ? () => setDrawerOpen(true) : undefined} />
        <main style={{ padding: isMobile ? 12 : 30 }}>{children}</main>
      </div>
    </>
  );
}
