"use client";

import React, { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/app/components/LanguageProvider";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/pushNotifications";

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  // Request push notification permission on mount
  useEffect(() => {
    requestNotificationPermission().catch(console.error);

    // Show foreground notifications as browser alerts
    onForegroundMessage((payload) => {
      if (Notification.permission === "granted" && payload.notification) {
        new Notification(payload.notification.title || "EcoHint", {
          body: payload.notification.body || "",
          icon: "/icons/icon-192x192.png",
        });
      }
    });
  }, []);

  const sidebarItems: Array<{ label: string; key: string; href?: string }> = [
    { label: t("Tela Inicial"), key: "Tela Inicial", href: "/user" },
    { label: t("Missões"), key: "Missões", href: "/user/missions" },
    { label: t("Impacto Ambiental"), key: "Impacto Ambiental", href: "/user/impacto-ambiental" },
    { label: t("Faturas"), key: "Faturas", href: "/user/faturas" },
    { label: t("Loja de Pontos"), key: "Loja de Pontos", href: "/user/loja-pontos" },
    { label: t("Rankings"), key: "Rankings", href: "/user/rankings" },
    { label: t("Notificações"), key: "Notificações", href: "/user/notificacoes" },
    { label: t("Educação Ambiental"), key: "Educação Ambiental", href: "/user/educacao-ambiental" },
    { label: t("Perfil"), key: "Perfil", href: "/user/perfil" },
    { label: t("Premium"), key: "Premium", href: "/user/premium" },
  ];

  const getActiveLabel = () => {
    const found = sidebarItems.find((item) => item.href === pathname);
    return found ? found.key : "Tela Inicial";
  };

  const activeLabel = getActiveLabel();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }} className="user-layout-wrapper">
      {/* Sidebar */}
      <div className="user-sidebar" style={{ width: 220, color: "white", padding: 20 }}>
        {sidebarItems.map((item) => {
          const isActive = item.key === activeLabel;
          return (
            <div
              key={item.label}
              style={{
                padding: "10px 15px",
                marginBottom: 10,
                cursor: item.href ? "pointer" : "default",
                backgroundColor: isActive ? "#52b788" : "transparent",
                color: "white",
                borderRadius: 6,
                border: isActive ? "1px solid #2d6a4f" : "1px solid transparent",
                transition: "background 0.2s, border-color 0.2s",
                opacity: item.href ? 1 : 0.7,
                fontWeight: isActive ? 700 : 500,
                textAlign: "center",
              }}
              onClick={() => {
                if (item.href) router.push(item.href);
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1 }}>
        <Header />
        <main style={{ padding: 30 }}>{children}</main>
      </div>
    </div>
  );
}
