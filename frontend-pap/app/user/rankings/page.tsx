"use client";

import { useEffect, useState } from "react";
import { carbonSavedFromPoints, getLevelFromPoints, niceNumber } from "@/lib/progress";
import { useLanguage } from "@/app/components/LanguageProvider";

type RankingItem = {
  id: number;
  name: string;
  level: number;
  carbon: number; // kg
  points: number;
  avatarUrl?: string;
};

export default function RankingsPage() {
  const { t } = useLanguage();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [myId, setMyId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      try {
        const [meRes, rankRes] = await Promise.all([
          fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/user/ranking", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const me = await meRes.json();
        const data = await rankRes.json();

        if (me?.eco_points !== undefined) {
          setMyPoints(me.eco_points);
          setMyId(me.id);
        }

        if (!Array.isArray(data)) return;

        const platformRanking = data
          .filter((userItem: any) => !!userItem.name)
          .map((userItem: any, index: number) => ({
            id: index + 1,
            name: userItem.name,
            points: userItem.eco_points || 0,
            level: getLevelFromPoints(userItem.eco_points || 0).level,
            carbon: carbonSavedFromPoints(userItem.eco_points || 0),
            avatarUrl:
              "https://api.dicebear.com/6.x/identicon/svg?seed=" + encodeURIComponent(userItem.name),
          }))
          .sort((a: any, b: any) => b.points - a.points)
          .map((item: any, idx: number) => ({ ...item, id: idx + 1 }));

        setRanking(platformRanking);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRanking();
    const interval = setInterval(fetchRanking, 30000);

    return () => clearInterval(interval);
  }, []);

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  return (
    <div style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>{t("Rankings")}</h1>
        <p style={{ margin: 0, color: "#666" }}>
          {t("Compare seu progresso com outros usuários em termos de nível e redução de pegada de carbono.")}
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 18px 0" }}>{t("Seu resumo")}</h2>
        <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220, padding: 18, borderRadius: 10, backgroundColor: "#f0fdf4" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>{t("Nível atual")}</p>
            <p style={{ margin: "8px 0 0 0", fontSize: 32, fontWeight: 700, color: "#16a34a" }}>{getLevelFromPoints(myPoints).level}</p>
          </div>
          <div style={{ flex: 1, minWidth: 220, padding: 18, borderRadius: 10, backgroundColor: "#e0f2fe" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>{t("Pegada de carbono")}</p>
            <p style={{ margin: "8px 0 0 0", fontSize: 32, fontWeight: 700, color: "#0284c7" }}>
              {niceNumber(carbonSavedFromPoints(myPoints))} kg
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 220, padding: 18, borderRadius: 10, backgroundColor: "#fef9c3" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>EcoPoints</p>
            <p style={{ margin: "8px 0 0 0", fontSize: 32, fontWeight: 700, color: "#ca8a04" }}>
              {myPoints.toLocaleString()} pts
            </p>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 18px 0" }}>{t("Top do ranking")}</h2>
        {ranking.length === 0 ? (
          <p style={{ color: "#666" }}>{t("Ainda não há ranking disponível. Complete missões para aparecer no ranking.")}</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {ranking.map((item, index) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: index === 0 ? "#f0fdf4" : "#fff",
                  border: index === 0 ? "1px solid #22c55e" : "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {t("Nível")} {item.level} • {niceNumber(item.carbon)} kg CO₂
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#555" }}>EcoPoints</div>
                  <div style={{ fontWeight: 700 }}>{item.points.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
