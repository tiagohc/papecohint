"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
import {
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
} from "../components/tableStyles";

type Summary = {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  totalPartners: number;
  totalRewards: number;
  totalMissions: number;
  totalStock: number;
  avgPointsCost: number;
  totalPremiumUsers: number;
};

type PartnerStats = {
  id: number;
  name: string;
  totalRewards: number;
  totalStock: number;
};

type TopReward = {
  id: number;
  name: string;
  points: number;
  availableStock: number;
  partnerName: string;
};

export default function ReportsPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [topRewards, setTopRewards] = useState<TopReward[]>([]);
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("/api/admin/reports/summary", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("/api/admin/reports/rewards-by-partner", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("/api/admin/reports/top-rewards", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("/api/admin/reports/users-by-role", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([summary, partners, rewards, roles]) => {
        setSummary(summary);
        setPartnerStats(partners);
        setTopRewards(rewards);
        setUsersByRole(roles);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  if (loading) return <p>{t("Carregando relatórios...")}</p>;

  const cardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "var(--bg-card)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const titleStyle = {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  };

  const roleLabel = (role: string) => {
    if (role === "admin") return t("Administrador");
    if (role === "partner") return t("Parceiro");
    return t("Utilizador");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>{t("Relatórios")}</h1>

      {/* Resumo Geral */}
      {summary && (
        <div style={cardStyle}>
          <div style={titleStyle}>{t("Resumo Geral")}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 15,
            }}
          >
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Total Utilizadores")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalUsers}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Admins")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalAdmins}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Utilizadores Normais")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalRegularUsers}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Total Parceiros")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalPartners}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#fef3c7", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#92400e" }}>{t("Utilizadores Premium")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#92400e" }}>
                {summary.totalPremiumUsers}
              </p>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 15,
              marginTop: 15,
            }}
          >
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Total Rewards")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalRewards}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Total Missões")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalMissions}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Stock Total")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalStock}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>{t("Custo Médio Pontos")}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.avgPointsCost !== null && summary.avgPointsCost !== undefined 
                  ? Number(summary.avgPointsCost).toFixed(2) 
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Utilizadores por Tipo */}
      <div style={cardStyle}>
        <div style={titleStyle}>{t("Utilizadores por Tipo")}</div>
        <div style={adminTableContainerStyle}>
          <table style={adminTableStyle}>
            <thead>
              <tr style={adminTableHeadRowStyle}>
                <th style={adminTableHeaderCellStyle}>{t("Tipo")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Quantidade")}</th>
              </tr>
            </thead>
            <tbody>
              {usersByRole.map((role, idx) => (
                <tr key={role.role} style={adminTableRowStyle(idx)}>
                  <td style={adminTableCellStyle}>{roleLabel(role.role)}</td>
                  <td style={adminTableCellStyle}>{role.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rewards por Parceiro */}
      <div style={cardStyle}>
        <div style={titleStyle}>{t("Rewards por Parceiro")}</div>
        <div style={adminTableContainerStyle}>
          <table style={adminTableStyle}>
            <thead>
              <tr style={adminTableHeadRowStyle}>
                <th style={adminTableHeaderCellStyle}>{t("Parceiro")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Total Rewards")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Stock Total")}</th>
              </tr>
            </thead>
            <tbody>
              {partnerStats.map((partner, idx) => (
                <tr key={partner.id} style={adminTableRowStyle(idx)}>
                  <td style={adminTableCellStyle}>{partner.name}</td>
                  <td style={adminTableCellStyle}>{partner.totalRewards || 0}</td>
                  <td style={adminTableCellStyle}>{partner.totalStock || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Rewards */}
      <div style={cardStyle}>
        <div style={titleStyle}>{t("Top 10 Rewards com Mais Stock")}</div>
        <div style={adminTableContainerStyle}>
          <table style={adminTableStyle}>
            <thead>
              <tr style={adminTableHeadRowStyle}>
                <th style={adminTableHeaderCellStyle}>{t("Nome")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Parceiro")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Pontos")}</th>
                <th style={adminTableHeaderCellStyle}>{t("Stock")}</th>
              </tr>
            </thead>
            <tbody>
              {topRewards.map((reward, idx) => (
                <tr key={reward.id} style={adminTableRowStyle(idx)}>
                  <td style={adminTableCellStyle}>{reward.name}</td>
                  <td style={adminTableCellStyle}>{reward.partnerName || "N/A"}</td>
                  <td style={adminTableCellStyle}>{reward.points}</td>
                  <td style={adminTableCellStyle}>{reward.availableStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
