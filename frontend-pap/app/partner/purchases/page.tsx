"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

type Redemption = {
  id: number;
  user_name: string;
  user_email: string;
  reward_name: string;
  points_used: number;
  full_name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export default function PartnerPurchasesPage() {
  const { t } = useLanguage();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Redemption | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    fetch("/api/partner/rewards/redemptions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setRedemptions(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const shellCardStyle = {
    backgroundColor: "var(--bg-card)",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid var(--border)",
  } as const;

  if (loading) {
    return (
      <div style={{ padding: 40, color: "var(--text-secondary)" }}>
        {t("A carregar compras...")}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24, minWidth: 0 }}>
      <div style={{ ...shellCardStyle, padding: 24 }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: 20, color: "var(--text-main)" }}>
          {t("Compras dos meus produtos")}
        </h3>
        <p style={{ margin: "0 0 20px 0", color: "var(--text-secondary)", fontSize: 14 }}>
          {t("Lista de todos os utilizadores que resgataram os teus produtos.")}
        </p>

        {redemptions.length === 0 ? (
          <div style={{
            border: "1px dashed var(--border)", borderRadius: 10, padding: 28,
            textAlign: "center", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary, #f8fafc)",
          }}>
            {t("Ainda não houve compras dos teus produtos.")}
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary, #edf3fb)" }}>
                  {[t("Data"), t("Utilizador"), t("Produto"), t("Pontos"), t("Morada")].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {redemptions.map((rd) => (
                  <tr key={rd.id}>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
                      {new Date(rd.created_at).toLocaleString("pt-PT")}
                    </td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{rd.user_name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{rd.user_email}</div>
                    </td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px", color: "var(--text-main)" }}>{rd.reward_name}</td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px", color: "#0f766e", fontWeight: 700 }}>{rd.points_used}</td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      {rd.full_name ? (
                        <button
                          onClick={() => setSelected(rd)}
                          style={{ background: "none", border: "none", color: "#0f766e", cursor: "pointer", textDecoration: "underline", fontSize: 13, padding: 0, fontWeight: 600 }}
                        >
                          {rd.full_name}
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal morada */}
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ backgroundColor: "#fff", borderRadius: 12, padding: 32, minWidth: 360, maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18 }}>{t("Detalhes da Compra")}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {[
                  [t("Produto"), selected.reward_name],
                  [t("Utilizador"), `${selected.user_name} (${selected.user_email})`],
                  [t("Nome completo"), selected.full_name],
                  [t("Morada"), selected.address],
                  [t("Cidade"), selected.city],
                  [t("Código Postal"), selected.postal_code],
                  [t("Telefone"), selected.phone || "—"],
                  [t("Notas"), selected.notes || "—"],
                  [t("Data"), new Date(selected.created_at).toLocaleString("pt-PT")],
                ].map(([label, value]) => (
                  <tr key={String(label)} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0", fontWeight: 600, color: "#374151", width: "40%" }}>{label}</td>
                    <td style={{ padding: "8px 0", color: "#4b5563" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setSelected(null)}
              style={{ marginTop: 24, padding: "10px 24px", backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
            >
              {t("Fechar")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
