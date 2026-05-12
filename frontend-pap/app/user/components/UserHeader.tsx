"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import HeaderToggles from "@/components/HeaderToggles";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";

export default function UserHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const fetchUser = () => {
      fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setUser(data))
        .catch(console.error);
    };

    fetchUser();
    // Evento customizado disparado pela página de perfil após guardar alterações.
    // Permite actualizar o nome no header imediatamente sem recarregar a página.
    window.addEventListener("profile-updated", fetchUser);
    return () => window.removeEventListener("profile-updated", fetchUser);
  }, []);

  const handleLogout = () => {
    setTheme("light");
    localStorage.removeItem("theme");
    localStorage.removeItem("token");
    router.push("/");
  };

  const sectionTitleMap: Record<string, string> = {
    "/user": t("Tela Inicial"),
    "/user/missions": t("Missões"),
    "/user/impacto-ambiental": t("Impacto Ambiental"),
    "/user/loja-pontos": t("Loja de Pontos"),
    "/user/rankings": t("Rankings"),
    "/user/notificacoes": t("Notificações"),
    "/user/perfil": t("Perfil"),
    "/user/premium": t("Premium"),
  };

  const sectionTitle = sectionTitleMap[pathname] || t("Portal Utilizador");

  return (
    <header
      style={{
        backgroundColor: "#fff",
        borderBottom: "3px solid #22c55e",
        padding: "20px 30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Botão hamburguer — só visível em mobile */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="hamburger-btn"
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 26, color: "#1f2937", padding: "0 4px",
              lineHeight: 1,
            }}
          >☰</button>
        )}
        <img
          src="/logoback.png"
          alt="EcoHint"
          style={{ width: 42, height: 42, objectFit: "contain" }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#1f2937" }}>
            {sectionTitle}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: 12, color: "#666" }}>
            {t("Bem-vindo")}, {user?.name || user?.email || ""}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HeaderToggles />
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
            transition: "all 0.2s",
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
