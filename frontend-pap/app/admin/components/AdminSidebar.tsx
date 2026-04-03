"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const menuItems = [
    { name: "Utilizadores", href: "/admin/users" },
    { name: "Parceiros", href: "/admin/partners" },
    { name: "Produtos", href: "/admin/rewards" },
    { name: "Missões", href: "/admin/missions" },
    { name: "Relatórios", href: "/admin/reports" },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        EcoHint
      </div>
      <div className="section">
        <p className="section-title">Ferramentas Admin</p>
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
