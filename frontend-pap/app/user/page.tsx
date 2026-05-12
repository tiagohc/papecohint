// app/user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { carbonSavedFromPoints, getLevelFromPoints } from "@/lib/progress";
import { useLanguage } from "@/app/components/LanguageProvider";

type User = {
  id: number;
  name: string;
  email: string;
};

type Reward = {
  id: number;
  name: string;
  points: number;
  description?: string;
  partnerName?: string;
  stock: number;
};

type Mission = {
  id: number;
  title: string;
  description?: string;
  points: number;
  type: string;
  verification_type?: string;
};

export default function UserPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [totalMissions, setTotalMissions] = useState(0);
  const [impact, setImpact] = useState<{ co2_kg: number; energy_kwh: number; trips: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    // Get user info
    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`/me: ${r.status}`); return r.json(); })
      .then(data => {
        setUser(data);
        if (typeof data.eco_points === "number") {
          setUserPoints(data.eco_points);
          localStorage.setItem("ecohint-points", String(data.eco_points));
        }
      })
      .catch(console.error);

    // Get rewards
    fetch("/api/user/rewards", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`/rewards: ${r.status}`); return r.json(); })
      .then(data => { const all = Array.isArray(data) ? data : []; setTotalRewards(all.length); setRewards(all.slice(0, 3)); })
      .catch(console.error);

    // Get impact
    fetch("/api/user/impact", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`/impact: ${r.status}`); return r.json(); })
      .then(data => setImpact(data))
      .catch(console.error);

    // Get completed missions count from history
    fetch("/api/user/missions/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`/missions/history: ${r.status}`); return r.json(); })
      .then(data => {
        const count = Array.isArray(data) ? data.filter((m: { isCompleted: number }) => m.isCompleted).length : 0;
        setMissionsCompleted(count);
      })
      .catch(console.error);

    // Get active missions
    fetch("/api/user/missions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`/missions: ${r.status}`); return r.json(); })
      .then(data => {
        const all = Array.isArray(data) ? data : [];
        setTotalMissions(all.length);
        setActiveMissions(all.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, router]);

  const cardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const buttonStyle = {
    padding: "8px 16px",
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 14,
  };

  const levelInfo = getLevelFromPoints(userPoints);
  const carbonSaved = carbonSavedFromPoints(userPoints);

  if (loading) return <p>{t("Carregando...")}</p>;

  return (
    <div className="page-content" style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      {/* Welcome */}
      {user && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            {t("Olá")}, {user.name || user.email}!
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: 14 }}>
            {t("Bem-vindo à tua área pessoal.")}
          </p>
        </div>
      )}
      {/* Stats Grid */}
      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 15,
          marginBottom: 30,
        }}
      >
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("ECOPOINTS")}</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#22c55e" }}>
            {userPoints.toLocaleString()}
          </p>
        </div>
        {missionsCompleted > 0 ? (
          <div
            style={{
              ...cardStyle,
              cursor: "pointer",
              transition: "transform 0.1s",
            }}
            onClick={() => router.push("/user/missions")}
            onMouseOver={e => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("MISSÕES COMPLETAS")}</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#3b82f6" }}>
              {missionsCompleted}
            </p>
          </div>
        ) : (
          <div style={{ ...cardStyle, backgroundColor: "#f9fafb" }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("MISSÕES COMPLETAS")}</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 16, fontWeight: "bold", color: "#3b82f6" }}>
              {t("Nenhuma missão completa")}
            </p>
          </div>
        )}
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("PEGADA DE CARBONO")}</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#f59e0b" }}>
            {(impact?.co2_kg ?? carbonSaved).toFixed(1)} kg
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#9ca3af" }}>{t("CO₂ economizado")}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("NÍVEL")}</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#ec4899" }}>
            {levelInfo.level}
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: 12, color: "#666" }}>
            {t("Progresso:")} {(levelInfo.progress * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Rewards — só mostra se o utilizador já tem pontos */}
      {userPoints > 0 && <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{t("Rewards Disponíveis")}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {totalRewards > 3 && (
              <span style={{
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 13,
                fontWeight: 600,
              }}>
                +{totalRewards - 3}
              </span>
            )}
            <button style={buttonStyle} onClick={() => router.push("/user/loja-pontos")}>{t("Ver todas")}</button>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 15,
          }}
        >
          {rewards.map(reward => (
            <div
              key={reward.id}
              style={{
                padding: 15,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <h3 style={{ margin: "0 0 5px 0", fontSize: 16 }}>{reward.name}</h3>
              <p style={{ margin: 0, color: "#666", fontSize: 12 }}>
                {reward.partnerName || t("Sem parceiro")}
              </p>
              <p style={{ margin: "10px 0", fontSize: 24, fontWeight: "bold", color: "#22c55e" }}>
                {reward.points} EcoPts
              </p>
              <button
                style={{
                  ...buttonStyle,
                  marginTop: 10,
                  width: "100%",
                  backgroundColor: reward.stock > 0 ? "#22c55e" : "#d1d5db",
                  cursor: reward.stock > 0 ? "pointer" : "not-allowed",
                }}
                disabled={reward.stock === 0}
                onClick={() => reward.stock > 0 && router.push("/user/loja-pontos")}
              >
                {reward.stock > 0 ? t("Redimir") : t("Sem stock")}
              </button>
            </div>
          ))}
        </div>
      </div>}

      {/* Missões */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{t("Missões Ativas")}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {totalMissions > 3 && (
              <span style={{
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 13,
                fontWeight: 600,
              }}>
                +{totalMissions - 3}
              </span>
            )}
            <button style={buttonStyle} onClick={() => router.push("/user/missions")}>{t("Ver todas")}</button>
          </div>
        </div>
        {activeMissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, backgroundColor: "#f9fafb", borderRadius: 8 }}>
            <p style={{ color: "#666" }}>{t("Nenhuma missão ativa no momento")}</p>
            <button style={buttonStyle} onClick={() => router.push("/user/missions")}>{t("Explorar Missões")}</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 15 }}>
            {activeMissions.map(mission => (
              <div
                key={mission.id}
                style={{ padding: 15, border: "1px solid #e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb", cursor: "pointer" }}
                onClick={() => router.push("/user/missions")}
              >
                <h3 style={{ margin: "0 0 5px 0", fontSize: 15 }}>{mission.title}</h3>
                <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: 12 }}>{mission.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: "bold", color: "#22c55e" }}>{mission.points} EcoPts</span>
                  <span style={{ fontSize: 11, color: "#fff", backgroundColor: mission.type === "daily" ? "#3b82f6" : "#8b5cf6", padding: "2px 8px", borderRadius: 12 }}>
                    {mission.type === "daily" ? t("Diária") : t("Mensal")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Impacto */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0" }}>{t("Seu Impacto")}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 15,
          }}
        >
          <div style={{ padding: 15, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("CO2 Economizado")}</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#22c55e" }}>
              {impact ? impact.co2_kg.toFixed(2) : "0"} kg
            </p>
          </div>
          <div style={{ padding: 15, backgroundColor: "#fef3c7", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("Árvores Plantadas")}</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#f59e0b" }}>
              {impact ? (impact.energy_kwh > 0 ? (impact.energy_kwh / 10).toFixed(1) : "0") : "0"}
            </p>
          </div>
          <div style={{ padding: 15, backgroundColor: "#dbeafe", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{t("Viagens de Autocarro")}</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#3b82f6" }}>
              {impact ? impact.trips : "0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
