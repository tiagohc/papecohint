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

export default function AdminRewards() {
  const { t } = useLanguage();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pending, setPending] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchRewards = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const [resAll, resPending] = await Promise.all([
        fetch("/api/admin/rewards", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/rewards/pending", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const dataAll = await resAll.json();
      const dataPending = await resPending.json();
      setRewards(Array.isArray(dataAll) ? dataAll : []);
      setPending(Array.isArray(dataPending) ? dataPending : []);
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
    </div>
  );
}
