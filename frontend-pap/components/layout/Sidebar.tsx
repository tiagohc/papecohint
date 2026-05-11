"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
};

const menuUser: MenuItem[] = [
  { label: "Tela Inicial", href: "/dashboard" },
  { label: "Meu Impacto", href: "/dashboard/user/impacto" },
  { label: "Missões", href: "/dashboard/user/missoes" },
];

const menuAdmin: MenuItem[] = [
  { label: "Utilizadores", href: "/dashboard/admin/users" },
  { label: "Missões", href: "/dashboard/admin/missoes" },
  { label: "Estatísticas", href: "/dashboard/admin/estatisticas" },
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
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
