"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import HeaderToggles from "@/components/HeaderToggles";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";

export default function PartnerHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    setTheme("light");
    localStorage.removeItem("theme");
    localStorage.removeItem("token");
    router.push("/");
  };

  const sectionTitleMap: Record<string, string> = {
    "/partner": t("Meus Produtos"),
  };

  const sectionTitle = sectionTitleMap[pathname] || t("Portal Parceiro");

  return (
    <header
      style={{
        backgroundColor: "#fff",
        borderBottom: "3px solid #22c55e",
        padding: isMobile ? "10px 12px" : "20px 30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, minWidth: 0, flex: 1 }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#1f2937", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
          >☰</button>
        )}
        {!isMobile && (
          <img src="/logoback.png" alt="EcoHint" style={{ width: 42, height: 42, objectFit: "contain", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 15 : 24, fontWeight: "bold", color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {sectionTitle}
          </h1>
          {!isMobile && (
            <p style={{ margin: "5px 0 0 0", fontSize: 12, color: "#666" }}>
              {t("Bem-vindo")}, {user?.name || user?.email || ""}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12, flexShrink: 0 }}>
        <HeaderToggles />
        <button
          onClick={handleLogout}
          style={{
            padding: isMobile ? "6px 10px" : "10px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: isMobile ? 12 : 14,
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
        >
          {t("Logout")}
        </button>
      </div>
    </header>
  );
}
