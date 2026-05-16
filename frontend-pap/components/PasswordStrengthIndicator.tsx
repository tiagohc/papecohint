"use client";

import { PASSWORD_CHECKS } from "@/lib/passwordValidator";

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_CHECKS.filter(c => c.test(password)).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  const labels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
  const color = colors[passed - 1] ?? "#e5e7eb";
  const label = passed > 0 ? labels[passed - 1] : "";

  return (
    <div style={{ marginBottom: 8 }}>
      {/* barra de força */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {PASSWORD_CHECKS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            backgroundColor: i < passed ? color : "#e5e7eb",
            transition: "background-color 0.2s",
          }} />
        ))}
      </div>
      {/* etiqueta */}
      {label && <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 6 }}>{label}</div>}
      {/* checklist */}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        {PASSWORD_CHECKS.map((check) => {
          const ok = check.test(password);
          return (
            <li key={check.label} style={{ fontSize: 11, color: ok ? "#16a34a" : "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}>
              <span>{ok ? "✓" : "○"}</span>
              {check.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
