// app/user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { carbonSavedFromPoints, getLevelFromPoints } from "@/lib/progress";

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

export default function UserPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  useEffect(() => {
    const storedPoints = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
    if (storedPoints) {
      setUserPoints(Number(storedPoints));
    }

    const storedMissionsCompleted =
      typeof window !== "undefined" ? localStorage.getItem("ecohint-missions-completed") : null;
    if (storedMissionsCompleted) {
      setMissionsCompleted(Number(storedMissionsCompleted));
    }

    if (!token) {
      router.push("/");
      return;
    }

    // Get user info
    fetch("http://localhost:8000/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setUser(data))
      .catch(console.error);

    // Get rewards
    fetch("http://localhost:8000/admin/rewards", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setRewards(Array.isArray(data) ? data : []))
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

  if (loading) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 15,
          marginBottom: 30,
        }}
      >
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#666", fontSize: 12 }}>ECOPOINTS</p>
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
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>MISSÕES COMPLETAS</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#3b82f6" }}>
              {missionsCompleted}
            </p>
          </div>
        ) : (
          <div style={{ ...cardStyle, backgroundColor: "#f9fafb" }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>MISSÕES COMPLETAS</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 16, fontWeight: "bold", color: "#3b82f6" }}>
              Nenhuma missão completa
            </p>
          </div>
        )}
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#666", fontSize: 12 }}>PEGADA DE CARBONO</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#f59e0b" }}>
            {carbonSaved.toFixed(1)} kg
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#666", fontSize: 12 }}>NÍVEL</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: "#ec4899" }}>
            {levelInfo.level}
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: 12, color: "#666" }}>
            Progresso: {(levelInfo.progress * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 15px 0" }}>Ações Rápidas</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button 
            style={buttonStyle}
            onClick={() => router.push("/user/missions")}
          >
            Ver Missões
          </button>
          <button 
            style={buttonStyle}
            onClick={() => router.push("/user/loja-pontos")}
          >
            Loja de Pontos
          </button>
          <button 
            style={buttonStyle}
            onClick={() => router.push("/user/impacto-ambiental")}
          >
            Meu Impacto
          </button>
          <button style={buttonStyle}>Configurações</button>
        </div>
      </div>

      {/* Rewards */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0" }}>Rewards Disponíveis</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 15,
          }}
        >
          {rewards.slice(0, 6).map(reward => (
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
                {reward.partnerName || "Sem parceiro"}
              </p>
              <p style={{ margin: "10px 0", fontSize: 24, fontWeight: "bold", color: "#22c55e" }}>
                {reward.points} pts
              </p>
              <p style={{ margin: "5px 0", color: "#666", fontSize: 12 }}>
                Stock: {reward.stock}
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
              >
                {reward.stock > 0 ? "Redimir" : "Sem stock"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Missões */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0" }}>Missões Ativas</h2>
        <div style={{ textAlign: "center", padding: 20, backgroundColor: "#f9fafb", borderRadius: 8 }}>
          <p style={{ color: "#666" }}>Nenhuma missão ativa no momento</p>
          <button 
            style={buttonStyle}
            onClick={() => router.push("/user/missions")}
          >
            Explorar Missões
          </button>
        </div>
      </div>

      {/* Impacto */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0" }}>Seu Impacto</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 15,
          }}
        >
          <div style={{ padding: 15, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>CO2 Economizado</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#22c55e" }}>
              0 kg
            </p>
          </div>
          <div style={{ padding: 15, backgroundColor: "#fef3c7", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>Árvores Plantadas</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#f59e0b" }}>
              0
            </p>
          </div>
          <div style={{ padding: 15, backgroundColor: "#dbeafe", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>Água Economizada</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#3b82f6" }}>
              0 L
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
