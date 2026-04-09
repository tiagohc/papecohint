"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function PartnerSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const menuItems = [
    { name: t("Meus Produtos"), href: "/partner" },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: "24px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/logoback.png" alt="EcoHint" style={{ width: 44, height: 44, objectFit: "contain" }} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>EcoHint</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{t("Portal Parceiro")}</div>
        </div>
      </div>

      <div className="section" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="section-title" style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          {t("Gestão da Loja")}
        </p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: 14,
          borderRadius: 12,
          background: "rgba(255,255,255,0.12)",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        Define os pontos, ajusta o stock e mantém o teu catálogo atualizado.
      </div>
    </aside>
  );
}
