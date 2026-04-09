"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
    setUserPoints(stored ? Number(stored) : 0);
  }, []);

  const userLevel = useMemo(() => getLevelFromPoints(userPoints).level, [userPoints]);
  const userCarbon = useMemo(() => carbonSavedFromPoints(userPoints), [userPoints]);

  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    const fetchRanking = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("ecohint-user") : null;

      const getCurrentUser = () => {
        if (!storedUser) return null;
        const parsed = JSON.parse(storedUser);
        const name = parsed?.name || t("Utilizador");
        return {
          id: parsed?.id || 0,
          name,
          points: userPoints,
          level: userLevel,
          carbon: userCarbon,
          avatarUrl: parsed?.avatar || "https://api.dicebear.com/6.x/identicon/svg?seed=current",
        };
      };

      const currentUser = getCurrentUser();

      if (!token) {
        setRanking(currentUser ? [currentUser] : []);
        return;
      }

      try {
        const response = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!Array.isArray(data)) {
          setRanking(currentUser ? [currentUser] : []);
          return;
        }

        const platformRanking = data
          .filter((userItem: any) => !!userItem.name && typeof userItem.points === "number")
          .map((userItem: any, index: number) => ({
            id: index + 1,
            name: userItem.name,
            points: userItem.points,
            level: getLevelFromPoints(userItem.points).level,
            carbon: carbonSavedFromPoints(userItem.points),
            avatarUrl:
              userItem.avatar ||
              "https://api.dicebear.com/6.x/identicon/svg?seed=" + encodeURIComponent(userItem.name),
          }));

        const merged = currentUser
          ? [currentUser, ...platformRanking.filter((u) => u.name !== currentUser.name)]
          : platformRanking;

        const cleaned = merged
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.carbon !== a.carbon) return b.carbon - a.carbon;
            return b.level - a.level;
          })
          .map((item, idx) => ({ ...item, id: idx + 1 }));

        setRanking(cleaned);
      } catch (error) {
        setRanking(currentUser ? [currentUser] : []);
      }
    };

    fetchRanking();
    const interval = setInterval(fetchRanking, 10000); // a cada 10 segundos

    return () => clearInterval(interval);
  }, [userPoints, userLevel, userCarbon]);

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
            <p style={{ margin: "8px 0 0 0", fontSize: 32, fontWeight: 700, color: "#16a34a" }}>{userLevel}</p>
          </div>
          <div style={{ flex: 1, minWidth: 220, padding: 18, borderRadius: 10, backgroundColor: "#e0f2fe" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>{t("Pegada de carbono")}</p>
            <p style={{ margin: "8px 0 0 0", fontSize: 32, fontWeight: 700, color: "#0284c7" }}>
              {niceNumber(userCarbon)} kg
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 220, padding: 18, borderRadius: 10, backgroundColor: "#fef9c3" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>EcoPoints</p>
            <p style={{ margin: "8px 0 0 0", fontSize: 32, fontWeight: 700, color: "#ca8a04" }}>
              {userPoints.toLocaleString()} pts
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
