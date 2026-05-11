"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

type Product = {
  id: number;
  name: string;
  partnerName?: string;
  points: number;
  stock: number;
  description?: string;
};

type SelectionState = Record<number, number>;

type AddressForm = {
  full_name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  notes: string;
};

export default function LojaDePontosPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionState>({});
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [userPoints, setUserPoints] = useState(0);
  const [addressModal, setAddressModal] = useState<Product | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    full_name: "", address: "", city: "", postal_code: "", phone: "", notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    // Sync points from DB
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (typeof data.eco_points === "number") {
          setUserPoints(data.eco_points);
          localStorage.setItem("ecohint-points", String(data.eco_points));
        }
      })
      .catch(console.error);

    // Fetch real products
    fetch("/api/user/rewards", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
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
    if (totalPoints > userPoints) {
      setMessageType("error");
      setCheckoutMessage(`Não tens pontos suficientes. Precisas de ${totalPoints} pts e tens apenas ${userPoints} pts.`);
      return;
    }
    setAddressModal(product);
  };

  const handleConfirmRedeem = async () => {
    if (!addressModal) return;
    if (!addressForm.full_name || !addressForm.address || !addressForm.city || !addressForm.postal_code) {
      setMessageType("error");
      setCheckoutMessage("Preenche todos os campos obrigatórios (nome, morada, cidade e código postal).");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rewardId: addressModal.id, ...addressForm }),
      });
      const data = await res.json();
      setAddressModal(null);
      if (!res.ok) {
        setMessageType("error");
        setCheckoutMessage(data.error || "Erro ao resgatar recompensa.");
        return;
      }
      const newPoints = userPoints - addressModal.points;
      setUserPoints(newPoints);
      localStorage.setItem("ecohint-points", String(newPoints));
      setMessageType("success");
      setCheckoutMessage(data.message);
    } catch {
      setMessageType("error");
      setCheckoutMessage("Erro de ligação ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  if (loading) return <p>{t("Carregando loja...")}</p>;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 6,
    border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>

      {/* Modal morada de entrega */}
      {addressModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 30, maxWidth: 480, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 5px 0" }}>{t("Morada de Entrega")}</h2>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: 13 }}>
              {addressModal.name} — <strong>{addressModal.points} EcoPts</strong>
            </p>

            {checkoutMessage && (
              <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{checkoutMessage}</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input style={inputStyle} placeholder={t("Nome completo *")} value={addressForm.full_name}
                onChange={e => setAddressForm(f => ({ ...f, full_name: e.target.value }))} />
              <input style={inputStyle} placeholder={t("Morada (rua, número) *")} value={addressForm.address}
                onChange={e => setAddressForm(f => ({ ...f, address: e.target.value }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} placeholder={t("Cidade *")} value={addressForm.city}
                  onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} />
                <input style={inputStyle} placeholder={t("Código Postal *")} value={addressForm.postal_code}
                  onChange={e => setAddressForm(f => ({ ...f, postal_code: e.target.value }))} />
              </div>
              <input style={inputStyle} placeholder={t("Telefone")} value={addressForm.phone}
                onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} />
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} placeholder={t("Notas adicionais (opcional)")}
                value={addressForm.notes} onChange={e => setAddressForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setAddressModal(null); setCheckoutMessage(null); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: "1px solid #d1d5db", backgroundColor: "#fff", cursor: "pointer", fontSize: 14 }}
              >
                {t("Cancelar")}
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={submitting}
                style={{ flex: 2, padding: "10px 0", borderRadius: 6, border: "none", backgroundColor: submitting ? "#86efac" : "#22c55e", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}
              >
                {submitting ? t("A processar...") : t("Confirmar Compra")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>{t("Loja de Pontos")}</h1>
        <p style={{ margin: 0, color: "#666" }}>
          {t("Escolha produtos disponíveis e selecione a quantidade (até 10 unidades). Os pontos necessários serão calculados automaticamente.")}
        </p>
        <p style={{ margin: "10px 0 0 0", color: "#1f2937", fontWeight: 600 }}>
          {t("Saldo atual:")} <span style={{ color: "#16a34a" }}>{userPoints.toLocaleString()} EcoPts</span>
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
                  {disabled ? t("Neste momento não está disponível") : t("Disponível")}
                </div>
              </div>

              <p style={{ margin: "10px 0 10px 0", color: "#444" }}>{product.description}</p>

              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: 12, color: "#555" }}>{t("Quantidade")}</label>
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
                  <div style={{ fontSize: 12, color: "#555" }}>{t("Total de pontos")}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>
                    {totalPoints} EcoPts
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
                  {t("Comprar")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
