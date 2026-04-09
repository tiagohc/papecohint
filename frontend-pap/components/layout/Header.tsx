"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderToggles from "@/components/HeaderToggles";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useTheme } from "next-themes";

const getFirstName = (name: string | undefined | null, fallbackName: string) => {
  if (!name) return fallbackName;
  const first = name.trim().split(" ")[0];
  if (!first || first.toLowerCase().includes("usuário") || first.toLowerCase().includes("user")) {
    return fallbackName;
  }
  return first;
};

export default function Header() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [rawName, setRawName] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("ecohint-user") : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) setRawName(parsed.name);
      } catch {
        // ignore parse error
      }
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          setUser(data);
          if (data?.name) setRawName(data.name);
        })
        .catch(console.error);
    }
  }, []);

  const displayName = getFirstName(rawName, t("Utilizador"));

  const handleLogout = () => {
    setTheme("light");
    localStorage.removeItem("theme");
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <header className="header" style={{ padding: "6px 12px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div className="header-left" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <img src="/logoback.png" alt="EcoHint" style={{ height: 56, width: 56, objectFit: "contain" }} />
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
            {t("Bem-vindo")}, {displayName}
          </p>
        </div>
      </div>
      <div className="header-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <HeaderToggles />
        <button
          className="logout"
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
