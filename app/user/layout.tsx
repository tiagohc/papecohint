"use client";

import React, { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const sidebarItems: Array<{ label: string; href?: string }> = [
    { label: "Tela Inicial", href: "/user" },
    { label: "Missões", href: "/user/missions" },
    { label: "Impacto Ambiental", href: "/user/impacto-ambiental" },
    { label: "Faturas", href: "/user/faturas" },
    { label: "Loja de Pontos", href: "/user/loja-pontos" },
    { label: "Rankings", href: "/user/rankings" },
    { label: "Notificações", href: "/user/notificacoes" },
    { label: "Educação Ambiental", href: "/user/educacao-ambiental" },
    { label: "Perfil", href: "/user/perfil" },
    { label: "Premium", href: "/user/premium" },
  ];

  const getActiveLabel = () => {
    const found = sidebarItems.find((item) => item.href === pathname);
    return found ? found.label : "Tela Inicial";
  };

  const activeLabel = getActiveLabel();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#e0f2f1" }}>
      {/* Sidebar */}
      <div style={{ width: 220, backgroundColor: "#00796b", color: "#fff", padding: 20 }}>
        <img src="/logoback.png" alt="EcoHint" style={{ width: 56, marginBottom: 24, display: "block" }} />
        {sidebarItems.map((item) => {
          const isActive = item.label === activeLabel;
          return (
            <div
              key={item.label}
              style={{
                padding: "10px 15px",
                marginBottom: 10,
                cursor: item.href ? "pointer" : "default",
                backgroundColor: isActive ? "#004d40" : "transparent",
                borderRadius: 4,
                transition: "background 0.2s",
                opacity: item.href ? 1 : 0.7,
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
