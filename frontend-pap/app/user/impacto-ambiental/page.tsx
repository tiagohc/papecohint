"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { carbonSavedFromPoints } from "@/lib/progress";
import { useLanguage } from "@/app/components/LanguageProvider";

type ImpactMetric = {
  label: string;
  value: number;
  unit: string;
  color: string;
  description: string;
};

export default function ImpactoAmbientalPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);

  const computeMetrics = (userPoints: number): ImpactMetric[] => {
    const carbon = carbonSavedFromPoints(userPoints);
    const water = userPoints * 0.58; // aproximado em litros por ponto
    const energy = carbon * 0.339; // aproximado em kWh por kg de CO₂

    return [
      {
        label: t("CO₂ Economizado"),
        value: Number(carbon.toFixed(1)),
        unit: "kg",
        color: "#22c55e",
        description: userPoints > 0
          ? t("Equivalente a uma viagem de 60 km de carro (média).")
          : t("Sem economia registrada ainda. Complete missões para começar a reduzir CO₂."),
      },
      {
        label: t("Água Economizada"),
        value: Number(water.toFixed(0)),
        unit: "L",
        color: "#3b82f6",
        description: userPoints > 0
          ? t("Equivalente a 3 banhos rápidos.")
          : t("Sem economia registrada ainda. Complete missões para começar a economizar água."),
      },
      {
        label: t("Energia Poupada"),
        value: Number(energy.toFixed(1)),
        unit: "kWh",
        color: "#f59e0b",
        description: userPoints > 0
          ? t("Suficiente para iluminar uma casa por 2 horas.")
          : t("Sem economia registrada ainda. Complete missões para começar a poupar energia."),
      },
    ];
  };

  useEffect(() => {
    const update = () => {
      const storedPoints = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
      const numericPoints = storedPoints ? Number(storedPoints) : 0;
      setPoints(numericPoints);
      setMetrics(computeMetrics(numericPoints));
      setLoading(false);
    };

    update();
    const interval = setInterval(update, 10000); // atualizar a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>{t("Carregando impacto ambiental...")}</p>;

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>{t("Impacto Ambiental")}</h1>
        <p style={{ margin: 0, color: "#666" }}>
          {t("Aqui você pode acompanhar como as suas ações impactam positivamente o planeta. Continue completando missões para melhorar seus números!")}
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
        <h2 style={{ margin: "0 0 15px 0" }}>{t("Como melhorar seu impacto")}</h2>
        <ul style={{ paddingLeft: 20, margin: 0, color: "#444" }}>
          <li>{t("Complete missões que geram pontos e reduzem a pegada de carbono.")}</li>
          <li>{t("Opte por transporte sustentável sempre que possível.")}</li>
          <li>{t("Consuma menos água: prefira banhos mais rápidos e conserte vazamentos.")}</li>
          <li>{t("Desligue aparelhos quando não estiver usando para economizar energia.")}</li>
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
