"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  partnerName?: string;
  points: number;
  stock: number;
  description?: string;
};

type SelectionState = Record<number, number>;

export default function LojaDePontosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionState>({});
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const storedPoints = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
    if (storedPoints) {
      setUserPoints(Number(storedPoints));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ecohint-points", String(userPoints));
  }, [userPoints]);

  useEffect(() => {
    // TODO: substituir por chamada real à API (ex.: /admin/rewards)
    const mockProducts: Product[] = [
      {
        id: 1,
        name: "Camiseta EcoHint",
        partnerName: "Loja Verde",
        points: 120,
        stock: 5,
        description: "Camiseta 100% algodão orgânico com logo EcoHint.",
      },
      {
        id: 2,
        name: "Caneca Sustentável",
        partnerName: "Casa Ecológica",
        points: 90,
        stock: 10,
        description: "Caneca reutilizável para reduzir descartáveis.",
      },
      {
        id: 3,
        name: "Kit de Jardinagem",
        partnerName: "Verdejar",
        points: 220,
        stock: 3,
        description: "Kit com sementes, vasos e ferramentas básicas.",
      },
      {
        id: 4,
        name: "Bolsa Reutilizável",
        partnerName: "Loja Verde",
        points: 55,
        stock: 18,
        description: "Bolsa de tecido para compras e mercado.",
      },
    ];

    // Simula carregamento
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 400);
  }, []);

  const getQuantityOptions = (stock: number) => {
    // Permitir escolher de 1 até a quantidade disponível em stock.
    // Para evitar dropdowns gigantes, limitamos a 100 opções (ajustável se necessário).
    const max = Math.max(1, Math.min(stock, 100));
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const handleSelectQuantity = (productId: number, value: number) => {
    setSelection((prev) => ({ ...prev, [productId]: value }));
  };

  const handleBuy = (product: Product) => {
    const qty = selection[product.id] ?? 1;
    const totalPoints = product.points * qty;

    if (qty < 1) return;

    if (qty > product.stock) {
      setMessageType("error");
      setCheckoutMessage(`Estoque insuficiente para ${product.name}. Escolha uma quantidade menor.`);
      return;
    }

    if (totalPoints > userPoints) {
      setMessageType("error");
      setCheckoutMessage(
        `Você não tem pontos suficientes. Precisa de ${totalPoints} pts e tem apenas ${userPoints} pts.`
      );
      return;
    }

    setUserPoints((prev) => prev - totalPoints);
    setMessageType("success");
    setCheckoutMessage(
      `Você comprou ${qty}x ${product.name} (${product.partnerName || "Loja"}) por ${totalPoints} pontos.`
    );
  };

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  if (loading) return <p>Carregando loja...</p>;

  return (
    <div style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>🏬 Loja de Pontos</h1>
        <p style={{ margin: 0, color: "#666" }}>
          Escolha produtos disponíveis e selecione a quantidade (até 10 unidades). Os pontos necessários
          serão calculados automaticamente.
        </p>
        <p style={{ margin: "10px 0 0 0", color: "#1f2937", fontWeight: 600 }}>
          Saldo atual: <span style={{ color: "#16a34a" }}>{userPoints.toLocaleString()} pts</span>
        </p>
      </div>

      {checkoutMessage ? (
        <div
          style={{
            ...cardStyle,
            backgroundColor:
              messageType === "success"
                ? "#f0fdf4"
                : messageType === "error"
                ? "#fef2f2"
                : "#e7f3ff",
            border:
              messageType === "success"
                ? "1px solid #22c55e"
                : messageType === "error"
                ? "1px solid #ef4444"
                : "1px solid #60a5fa",
          }}
        >
          <p
            style={{
              margin: 0,
              color:
                messageType === "success"
                  ? "#0f5132"
                  : messageType === "error"
                  ? "#991b1b"
                  : "#1e3a8a",
            }}
          >
            {checkoutMessage}
          </p>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        {products.map((product) => {
          const qty = selection[product.id] ?? 1;
          const totalPoints = product.points * qty;
          const disabled = product.stock === 0;

          return (
            <div key={product.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: "0 0 8px 0" }}>{product.name}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                    {product.partnerName ? `Loja: ${product.partnerName}` : "Loja: EcoHint"}
                  </p>
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    backgroundColor: disabled ? "#f8d7da" : "#e2f0ff",
                    color: disabled ? "#842029" : "#084298",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {disabled ? "Neste momento não está disponível" : `Stock: ${product.stock}`}
                </div>
              </div>

              <p style={{ margin: "10px 0 10px 0", color: "#444" }}>{product.description}</p>

              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: 12, color: "#555" }}>Quantidade</label>
                          <select
                    value={qty}
                    onChange={(event) => handleSelectQuantity(product.id, Number(event.target.value))}
                    style={{
                      marginLeft: 6,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      minWidth: 70,
                    }}
                    disabled={disabled}
                  >
                    {getQuantityOptions(product.stock).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#555" }}>Total de pontos</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>
                    {totalPoints} pts
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(product)}
                  disabled={disabled}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: disabled ? "#94a3b8" : "#22c55e",
                    color: "white",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Comprar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
