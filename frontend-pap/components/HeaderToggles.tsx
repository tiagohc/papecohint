"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

const btnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text-main)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  transition: "all 0.2s",
};

const languages = [
  { code: "pt" as const, label: "Português", short: "PT" },
  { code: "en" as const, label: "English", short: "EN" },
];

export default function HeaderToggles() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) return null;

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Language dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          style={btnStyle}
          title="Idioma / Language"
        >
          {currentLang.short}
        </button>

        {langOpen && (
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
              minWidth: 160,
              overflow: "hidden",
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setLangOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background: language === lang.code ? "var(--bg-secondary)" : "transparent",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  fontSize: 14,
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) => {
                  if (language !== lang.code) e.currentTarget.style.background = "var(--bg-secondary)";
                }}
                onMouseOut={(e) => {
                  if (language !== lang.code) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 24 }}>{lang.short}</span>
                <span>{lang.label}</span>
                {language === lang.code && <span style={{ marginLeft: "auto" }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        style={btnStyle}
        title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
