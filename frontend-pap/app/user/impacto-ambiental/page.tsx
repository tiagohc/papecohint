"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";

type ImpactData = {
  co2_kg: number;
  energy_kwh: number;
  trips: number;
  photo_missions: number;
};

export default function ImpactoAmbientalPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [impact, setImpact] = useState<ImpactData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    fetch("/api/user/impact", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setImpact(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>{t("Carregando impacto ambiental...")}</p>;

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  const metrics = [
    {
      label: t("CO₂ Evitado"),
      value: impact?.co2_kg ?? 0,
      unit: "kg",
      color: "#22c55e",
      description: (impact?.trips ?? 0) > 0
        ? `${impact!.trips} ${t("viagem(ns) de autocarro registada(s).")}`
        : t("Sem viagens registadas ainda. Submete bilhetes de transporte público."),
    },
    {
      label: t("Energia Poupada"),
      value: impact?.energy_kwh ?? 0,
      unit: "kWh",
      color: "#f59e0b",
      description: (impact?.energy_kwh ?? 0) > 0
        ? t("Estimativa baseada nas faturas de energia confirmadas.")
        : t("Sem faturas de energia confirmadas ainda."),
    },
  ];

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>{t("Impacto Ambiental")}</h1>
        <p style={{ margin: 0, color: "#666" }}>
          {t("Acompanha o impacto real das tuas ações. Os valores são calculados com base nas missões que concluíste.")}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 15,
          marginBottom: 30,
        }}
      >
        {metrics.map(metric => (
          <div key={metric.label} style={{ ...cardStyle, borderLeft: `6px solid ${metric.color}` }}>
            <p style={{ margin: 0, color: "#666", fontSize: 12 }}>{metric.label}</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 32, fontWeight: "bold", color: metric.color }}>
              {metric.value} {metric.unit}
            </p>
            <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: 13 }}>
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 15px 0" }}>{t("Como melhorar o teu impacto")}</h2>
        <ul style={{ paddingLeft: 20, margin: 0, color: "#444" }}>
          <li>{t("Usa transportes públicos e submete os bilhetes para registar CO₂ poupado.")}</li>
          <li>{t("Submete faturas de energia para acompanhar a redução de consumo.")}</li>
        </ul>
        <button
          style={{
            marginTop: 20,
            padding: "10px 18px",
            backgroundColor: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
          onClick={() => router.push("/user/missions")}
        >
          {t("Ir para Missões")}
        </button>
      </div>
    </div>
  );
}
