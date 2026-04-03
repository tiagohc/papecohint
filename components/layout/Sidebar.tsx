"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

const menuUser: MenuItem[] = [
  { label: "Tela Inicial", href: "/dashboard", icon: "🏠" },
  { label: "Meu Impacto", href: "/dashboard/user/impacto", icon: "📊" },
  { label: "Missões", href: "/dashboard/user/missoes", icon: "🎯" },
];

const menuAdmin: MenuItem[] = [
  { label: "Utilizadores", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Missões", href: "/dashboard/admin/missoes", icon: "🎯" },
  { label: "Estatísticas", href: "/dashboard/admin/estatisticas", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="logo">
        EcoHint
      </div>

      <div className="section">
        <p className="section-title">Utilizador</p>
        {menuUser.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="section">
        <p className="section-title">Admin</p>
        {menuAdmin.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
