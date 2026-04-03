"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => setUser(data))
        .catch(console.error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const sectionTitleMap: Record<string, string> = {
    "/admin/users": "Utilizadores",
    "/admin/partners": "Parceiros",
    "/admin/rewards": "Produtos",
    "/admin/missions": "Missões",
    "/admin/reports": "Relatórios",
  };

  const sectionTitle = sectionTitleMap[pathname] || "Dashboard";

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
        <img src="/logo.png" alt="EcoHint" style={{ width: 42, height: 42 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#1f2937" }}>
            {sectionTitle}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: 12, color: "#666" }}>
            {user?.name || "Administrador"}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
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
          Logout
        </button>
      </div>
    </header>
  );
}
