"use client";
import { useEffect, useState } from "react";

type Summary = {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  totalPartners: number;
  totalRewards: number;
  totalMissions: number;
  totalStock: number;
  avgPointsCost: number;
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
  const [summary, setSummary] = useState<Summary | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [topRewards, setTopRewards] = useState<TopReward[]>([]);
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("http://localhost:8000/admin/reports/summary", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("http://localhost:8000/admin/reports/rewards-by-partner", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("http://localhost:8000/admin/reports/top-rewards", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("http://localhost:8000/admin/reports/users-by-role", {
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

  if (loading) return <p>Carregando relatórios...</p>;

  const cardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const titleStyle = {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Relatórios</h1>

      {/* Resumo Geral */}
      {summary && (
        <div style={cardStyle}>
          <div style={titleStyle}>Resumo Geral</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 15,
            }}
          >
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Total Utilizadores</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalUsers}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Admins</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalAdmins}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Utilizadores Normais</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalRegularUsers}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Total Parceiros</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalPartners}
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
              <p style={{ margin: 0, color: "#666" }}>Total Rewards</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalRewards}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Total Missões</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalMissions}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Stock Total</p>
              <p style={{ margin: "5px 0 0 0", fontSize: 24, fontWeight: "bold" }}>
                {summary.totalStock}
              </p>
            </div>
            <div style={{ padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
              <p style={{ margin: 0, color: "#666" }}>Custo Médio Pontos</p>
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
        <div style={titleStyle}>Utilizadores por Tipo</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Tipo
              </th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody>
            {usersByRole.map((role) => (
              <tr key={role.role}>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {role.role === "admin" ? "Administrador" : "Utilizador"}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {role.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rewards por Parceiro */}
      <div style={cardStyle}>
        <div style={titleStyle}>Rewards por Parceiro</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Parceiro
              </th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Total Rewards
              </th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Stock Total
              </th>
            </tr>
          </thead>
          <tbody>
            {partnerStats.map((partner) => (
              <tr key={partner.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {partner.name}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {partner.totalRewards || 0}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {partner.totalStock || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top 10 Rewards */}
      <div style={cardStyle}>
        <div style={titleStyle}>Top 10 Rewards com Mais Stock</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Nome
              </th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Parceiro
              </th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Pontos
              </th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {topRewards.map((reward) => (
              <tr key={reward.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {reward.name}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {reward.partnerName || "N/A"}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {reward.points}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {reward.availableStock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
