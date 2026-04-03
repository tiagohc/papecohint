"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const getFirstName = (name: string | undefined | null) => {
  if (!name) return "Utilizador";
  const first = name.trim().split(" ")[0];
  if (!first || first.toLowerCase().includes("usuário") || first.toLowerCase().includes("user")) {
    return "Utilizador";
  }
  return first;
};

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [displayName, setDisplayName] = useState("Utilizador");

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("ecohint-user") : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) setDisplayName(getFirstName(parsed.name));
      } catch {
        // ignore parse error
      }
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          setUser(data);
          if (data?.name) setDisplayName(getFirstName(data.name));
        })
        .catch(console.error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <header className="header" style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
      <div className="header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/logoback.png" alt="EcoHint" style={{ height: 48, width: 48, objectFit: "contain" }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#0f766e" }}>EcoHint</h2>
          <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Bem-vindo, {displayName}</p>
        </div>
      </div>
      <div className="header-right">
        <button
          className="logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
