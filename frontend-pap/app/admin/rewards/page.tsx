"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";
import {
  adminActionDangerButtonStyle,
  adminActionPrimaryButtonStyle,
  adminTopActionButtonStyle,
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
} from "../components/tableStyles";

type Reward = {
  id: number;
  name: string;
  description: string;
  points: number;
  stock: number;
  image_url: string;
  partner_name: string;
  status: string;
};

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

export default function AdminRewards() {
  const { t } = useLanguage();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pending, setPending] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchRewards = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const [resAll, resPending, resRedemptions] = await Promise.all([
        fetch("/api/admin/rewards", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/rewards/pending", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/rewards/redemptions", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const dataAll = await resAll.json();
      const dataPending = await resPending.json();
      const dataRedemptions = await resRedemptions.json();
      setRewards(Array.isArray(dataAll) ? dataAll : []);
      setPending(Array.isArray(dataPending) ? dataPending : []);
      setRedemptions(Array.isArray(dataRedemptions) ? dataRedemptions : []);
      setLoading(false);
    } catch (err) {
      console.error("fetchRewards failed", err);
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!token) return;
    await fetch(`/api/admin/rewards/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRewards();
  };

  const handleReject = async (id: number) => {
    if (!token) return;
    await fetch(`/api/admin/rewards/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRewards();
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const deleteReward = async (id: number) => {
    if (!token) return;
    if (!confirm(t("Tem a certeza que quer remover este reward?"))) return;
    try {
      await fetch(`/api/admin/rewards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRewards();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40, color: "#1e293b" }}>
        <p>{t("Carregando rewards...")}</p>
      </div>
    );

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ marginBottom: 20 }}>{t("Painel Admin - Rewards")}</h1>

      {/* Pending approval section */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 12, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
            {t("Pendentes de aprovação")}
            <span style={{ padding: "2px 10px", borderRadius: 999, backgroundColor: "#fef3c7", color: "#92400e", fontSize: 13, fontWeight: 700 }}>
              {pending.length}
            </span>
          </h2>
          <div style={adminTableContainerStyle}>
            <table style={adminTableStyle}>
              <thead>
                <tr style={adminTableHeadRowStyle}>
                  <th style={adminTableHeaderCellStyle}>{t("Nome")}</th>
                  <th style={adminTableHeaderCellStyle}>{t("Parceiro")}</th>
                  <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
                  <th style={adminTableHeaderCellStyle}>{t("Stock")}</th>
                  <th style={adminTableHeaderCellStyle}>{t("Ações")}</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r, i) => (
                  <tr key={r.id} style={adminTableRowStyle(i)}>
                    <td style={adminTableCellStyle}>{r.name}</td>
                    <td style={adminTableCellStyle}>{r.partner_name || "—"}</td>
                    <td style={adminTableCellStyle}>{r.points}</td>
                    <td style={adminTableCellStyle}>{r.stock}</td>
                    <td style={adminTableCellStyle}>
                      <button
                        onClick={() => handleApprove(r.id)}
                        style={{ ...adminActionPrimaryButtonStyle, marginRight: 8 }}
                      >
                        {t("Aprovar")}
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        style={adminActionDangerButtonStyle}
                      >
                        {t("Rejeitar")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <button
          style={adminTopActionButtonStyle}
          onClick={() => router.push("/admin/rewards/new")}
        >
          {t("Novo Reward")}
        </button>
      </div>

      <div style={adminTableContainerStyle}>
        <table style={adminTableStyle}>
          <thead>
            <tr style={adminTableHeadRowStyle}>
              <th style={adminTableHeaderCellStyle}>{t("ID")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Nome")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Parceiro")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Stock")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Estado")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Foto")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Ações")}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r, i) => (
              <tr key={r.id} style={adminTableRowStyle(i)}>
                <td style={adminTableCellStyle}>{r.id}</td>
                <td style={adminTableCellStyle}>{r.name}</td>
                <td style={adminTableCellStyle}>{r.partner_name}</td>
                <td style={adminTableCellStyle}>{r.points}</td>
                <td style={adminTableCellStyle}>{r.stock}</td>
                <td style={adminTableCellStyle}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                    backgroundColor: r.status === "approved" ? "#dcfce7" : r.status === "pending" ? "#fef3c7" : "#fee2e2",
                    color: r.status === "approved" ? "#166534" : r.status === "pending" ? "#92400e" : "#991b1b",
                  }}>
                    {r.status === "approved" ? t("Aprovado") : r.status === "pending" ? t("Pendente") : t("Rejeitado")}
                  </span>
                </td>
                <td style={adminTableCellStyle}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 5 }} />
                  ) : (
                    "—"
                  )}
                </td>
                <td style={adminTableCellStyle}>
                  <button
                    onClick={() => router.push(`/admin/rewards/${r.id}`)}
                    style={{ ...adminActionPrimaryButtonStyle, marginRight: 8 }}
                  >
                    {t("Editar")}
                  </button>
                  <button
                    onClick={() => deleteReward(r.id)}
                    style={adminActionDangerButtonStyle}
                  >
                    {t("Deletar")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compras / Resgates */}
      <h2 style={{ marginTop: 40, marginBottom: 12, fontSize: 18 }}>{t("Compras de Produtos")}</h2>
      {redemptions.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{t("Sem compras registadas.")}</p>
      ) : (
        <div style={adminTableContainerStyle}>
          <table style={adminTableStyle}>
            <thead>
              <tr style={adminTableHeadRowStyle}>
                <th style={adminTableHeaderCellStyle}>{t("Data")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Utilizador")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Produto")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Morada")}</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((rd, i) => (
                <tr key={rd.id} style={adminTableRowStyle(i)}>
                  <td style={adminTableCellStyle}>{new Date(rd.created_at).toLocaleString("pt-PT")}</td>
                  <td style={adminTableCellStyle}>
                    <div style={{ fontWeight: 600 }}>{rd.user_name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{rd.user_email}</div>
                  </td>
                  <td style={adminTableCellStyle}>{rd.reward_name}</td>
                  <td style={adminTableCellStyle}>{rd.points_used}</td>
                  <td style={adminTableCellStyle}>
                    {rd.full_name ? (
                      <button
                        onClick={() => setSelectedRedemption(rd)}
                        style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", textDecoration: "underline", fontSize: 13, padding: 0 }}
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

      {/* Modal detalhe morada */}
      {selectedRedemption && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setSelectedRedemption(null)}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 32, minWidth: 360, maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18 }}>{t("Detalhes da Compra")}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {[
                  [t("Produto"), selectedRedemption.reward_name],
                  [t("Pontos gastos"), selectedRedemption.points_used],
                  [t("Utilizador"), `${selectedRedemption.user_name} (${selectedRedemption.user_email})`],
                  [t("Nome completo"), selectedRedemption.full_name],
                  [t("Morada"), selectedRedemption.address],
                  [t("Cidade"), selectedRedemption.city],
                  [t("Código Postal"), selectedRedemption.postal_code],
                  [t("Telefone"), selectedRedemption.phone || "—"],
                  [t("Notas"), selectedRedemption.notes || "—"],
                  [t("Data"), new Date(selectedRedemption.created_at).toLocaleString("pt-PT")],
                ].map(([label, value]) => (
                  <tr key={String(label)} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0", fontWeight: 600, color: "#374151", width: "40%" }}>{label}</td>
                    <td style={{ padding: "8px 0", color: "#4b5563" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setSelectedRedemption(null)}
              style={{ marginTop: 24, padding: "10px 24px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
            >
              {t("Fechar")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
