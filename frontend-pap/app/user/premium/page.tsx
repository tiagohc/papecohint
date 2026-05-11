"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

declare global {
  interface Window {
    easypayCheckout?: {
      startCheckout: (manifest: unknown, options?: unknown) => { unmount: () => void };
    };
  }
}

export default function PremiumPage() {
  const { t } = useLanguage();
  const planId = "premium-monthly";
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [premiumStatus, setPremiumStatus] = useState<string>("inactive");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const checkoutInstanceRef = useRef<{ unmount: () => void } | null>(null);

  const checkoutState = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("checkout") || "";
  }, []);

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "var(--bg-card)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
    color: "var(--text-main)",
  };

  const premiumCardStyle: React.CSSProperties = {
    ...cardStyle,
    border: "2px solid #22c55e",
    background: "var(--bg-card)",
  };

  const featureStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  };

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setFeedback(t("Faz login para ativar o Premium."));
          return;
        }

        const res = await fetch("/api/user/premium/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(t("Falha ao carregar estado premium"));
        }

        const data = await res.json();
        setPremiumStatus(data.status || "inactive");
        if (data.current_period_end) setPeriodEnd(data.current_period_end);
      } catch (err) {
        console.error(err);
        setFeedback(t("Não foi possível carregar o estado do Premium agora."));
      } finally {
        setLoadingStatus(false);
      }
    };

    loadStatus();
  }, []);

  useEffect(() => {
    if (checkoutState === "success") {
      setFeedback(t("Pagamento concluído. Estamos a confirmar o teu Premium."));
    }
    if (checkoutState === "cancel") {
      setFeedback(t("Checkout cancelado. Podes tentar novamente quando quiseres."));
    }
  }, [checkoutState]);

  const handleUpgrade = async (selectedPlanId: string) => {
    if (selectedPlanId !== planId) return;

    try {
      setLoadingCheckout(true);
      setFeedback("");

      const token = localStorage.getItem("token");
      if (!token) {
        setFeedback(t("Faz login para ativar o Premium."));
        return;
      }

      const res = await fetch("/api/user/easypay/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("Erro ao criar checkout"));
      }

      if (!data.manifest) {
        throw new Error(t("Manifest não recebido"));
      }

      // Load EasyPay SDK if not already loaded
      if (!window.easypayCheckout) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.easypay.pt/checkout/2.9.1/";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(t("Falha ao carregar SDK EasyPay")));
          document.head.appendChild(script);
        });
      }

      setShowCheckoutForm(true);

      // Small delay to let the container render
      await new Promise((r) => setTimeout(r, 100));

      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.unmount();
      }

      checkoutInstanceRef.current = window.easypayCheckout!.startCheckout(data.manifest, {
        id: "easypay-checkout",
        testing: true,
        display: "inline",
        language: "pt_PT",
        onSuccess: async (checkoutInfo: unknown) => {
          console.log("EasyPay success:", checkoutInfo);
          setShowCheckoutForm(false);
          checkoutInstanceRef.current = null;

          // Activate premium in DB
          try {
            const tkn = localStorage.getItem("token");
            const activateRes = await fetch("/api/user/premium/activate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tkn}`,
              },
            });
            if (activateRes.ok) {
              const activateData = await activateRes.json();
              setPremiumStatus("active");
              if (activateData.current_period_end) setPeriodEnd(activateData.current_period_end);
              setFeedback(t("Premium ativado com sucesso!"));
            } else {
              setPremiumStatus("active");
              setFeedback(t("Pagamento concluído! O teu Premium será ativado em breve."));
            }
          } catch {
            setPremiumStatus("active");
            setFeedback(t("Pagamento concluído! O teu Premium será ativado em breve."));
          }
        },
        onError: (error: { code: string }) => {
          console.error("EasyPay unrecoverable error:", error);
          if (error?.code === "checkout-expired") {
            setFeedback(t("Sessão expirada. Clica novamente em Ativar Premium."));
            setShowCheckoutForm(false);
            checkoutInstanceRef.current = null;
          }
          // Don't close for other errors — let user retry
        },
        onPaymentError: (error: { code: string; paymentMethod: string }) => {
          console.warn("EasyPay payment error (retry allowed):", error);
          setFeedback(t("Erro no pagamento — tenta outro método (ex: Multibanco)."));
        },
        onClose: () => {
          setShowCheckoutForm(false);
          checkoutInstanceRef.current = null;
        },
      });
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : t("Erro ao iniciar pagamento"));
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: 32, color: "#22c55e" }}>
            {t("EcoHint Premium")}
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: "var(--text-secondary)" }}>
            {t("Um único plano simples para acelerar os teus pontos com missões extra e recompensas exclusivas")}
          </p>
        </div>
      </div>

      {/* Plano Único */}
      <div style={{ maxWidth: 480, margin: "0 auto 30px auto" }}>
        <div style={{ ...premiumCardStyle, textAlign: "center", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: -10,
              right: 20,
              backgroundColor: "#22c55e",
              color: "white",
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {t("PLANO ÚNICO")}
          </div>

          <h3 style={{ margin: "0 0 8px 0", fontSize: 26 }}>{t("Premium")}</h3>
          <div style={{ fontSize: 40, fontWeight: "bold", color: "#22c55e", marginBottom: 4 }}>
            €2
          </div>
          <div style={{ color: "var(--text-secondary)", marginBottom: 18 }}>{t("por mês")}</div>

          <button
            onClick={() => handleUpgrade(planId)}
            disabled={loadingCheckout || loadingStatus || premiumStatus === "active"}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#22c55e",
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
              cursor: loadingCheckout || loadingStatus || premiumStatus === "active" ? "not-allowed" : "pointer",
              opacity: loadingCheckout || loadingStatus || premiumStatus === "active" ? 0.7 : 1,
            }}
          >
            {loadingCheckout ? t("A processar...") : premiumStatus === "active" ? t("Premium Ativo") : t("Ativar Premium")}
          </button>

          {feedback ? (
            <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-secondary)" }}>{feedback}</p>
          ) : null}

          {premiumStatus === "active" && periodEnd && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#22c55e", fontWeight: "bold" }}>
              {t("Expira em:")} {Math.max(0, Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} {t("dias")}
              ({new Date(periodEnd).toLocaleDateString("pt-PT")})
            </p>
          )}
        </div>
      </div>

      {/* EasyPay Checkout Form */}
      {showCheckoutForm && (
        <div style={{ maxWidth: 480, margin: "0 auto 30px auto" }}>
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 16px 0", textAlign: "center" }}>{t("Pagamento")}</h3>
            <div id="easypay-checkout" />
          </div>
        </div>
      )}

      {/* Benefícios Premium */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 20px 0", textAlign: "center" }}>
          {t("Benefícios Premium")}
        </h2>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>{t("Missões Extra")}</h3>
            <div style={featureStyle}>
              <span>{t("Conjunto adicional de missões semanais")}</span>
            </div>
            <div style={featureStyle}>
              <span>{t("Missões com pontuação superior")}</span>
            </div>
            <div style={featureStyle}>
              <span>{t("Desafios especiais mensais")}</span>
            </div>
            <div style={featureStyle}>
              <span>{t("Progressão premium dedicada")}</span>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#22c55e" }}>{t("Recompensas Exclusivas")}</h3>
            <div style={featureStyle}>
              <span>{t("Produtos exclusivos na loja de pontos")}</span>
            </div>
            <div style={featureStyle}>
              <span>{t("Campanhas limitadas para premium")}</span>
            </div>
            <div style={featureStyle}>
              <span>{t("Bónus de pontos em recompensas selecionadas")}</span>
            </div>
            <div style={featureStyle}>
              <span>{t("Novidades premium primeiro")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
