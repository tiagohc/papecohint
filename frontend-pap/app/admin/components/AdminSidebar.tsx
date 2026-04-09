"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const menuItems = [
    { name: t("Utilizadores"), href: "/admin/users" },
    { name: t("Parceiros"), href: "/admin/partners" },
    { name: t("Produtos"), href: "/admin/rewards" },
    { name: t("Missões"), href: "/admin/missions" },
    { name: t("Notificações"), href: "/admin/notifications" },
    { name: t("Relatórios"), href: "/admin/reports" },
  ];

  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "24px 18px" }}>
      <div className="logo" style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        EcoHint
      </div>
      <div className="section" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="section-title" style={{ margin: 0, marginBottom: 6, fontSize: 13, opacity: 0.9 }}>
          {t("Ferramentas Admin")}
        </p>
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
