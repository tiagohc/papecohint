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
};

export default function AdminRewards() {
  const { t } = useLanguage();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchRewards = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/admin/rewards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("fetchRewards response", res.status, data);
      setRewards(Array.isArray(data) ? data : []); // garante array
      setLoading(false);
    } catch (err) {
      console.error("fetchRewards failed", err);
      setLoading(false);
    }
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
    <div style={{ padding: 40, backgroundColor: "#f0fdf4", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e293b", marginBottom: 20 }}>{t("Painel Admin - Rewards")}</h1>

      <div style={adminTableContainerStyle}>
        <table style={adminTableStyle}>
          <thead>
            <tr style={adminTableHeadRowStyle}>
              <th style={adminTableHeaderCellStyle}>{t("ID")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Nome")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Parceiro")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Stock")}</th>
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

      <button
        style={{ ...adminTopActionButtonStyle, marginTop: 20 }}
        onClick={() => router.push("/admin/rewards/new")}
      >
        {t("Novo Reward")}
      </button>
    </div>
  );
}
