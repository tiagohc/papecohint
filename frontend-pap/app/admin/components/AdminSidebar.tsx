"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const fetchPending = () => {
      fetch("/api/admin/rewards/pending", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setPendingCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: t("Utilizadores"), href: "/admin/users" },
    { name: t("Parceiros"), href: "/admin/partners" },
    { name: t("Produtos"), href: "/admin/rewards", badge: pendingCount },
    { name: t("Missões"), href: "/admin/missions" },
    { name: t("Notificações"), href: "/admin/notifications" },
    { name: t("Relatórios"), href: "/admin/reports" },
  ];

  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 18px" }}>
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
    </aside>
  );
}
