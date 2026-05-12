"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
import Modal from "@/components/Modal";
import PartnerForm from "@/components/PartnerForm";
import FallbackImage from "@/components/FallbackImage";

type Reward = {
  id: number;
  name: string;
  description?: string;
  points: number;
  stock: number;
  image_url?: string;
  status: string;
};

export default function PartnerPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Reward[]>([]);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerFormSubmitted, setPartnerFormSubmitted] = useState(false);
    const handleOpenPartnerModal = () => setIsPartnerModalOpen(true);
    const handleClosePartnerModal = () => {
      setIsPartnerModalOpen(false);
      setPartnerFormSubmitted(false);
    };
    const handlePartnerFormSubmit = (data: { name: string; email: string; company: string }) => {
      setPartnerFormSubmitted(true);
      setTimeout(handleClosePartnerModal, 2000);
    };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadProducts = async () => {
    if (!token) {
      setLoading(false);
      setError(t("Sessão inválida"));
      return;
    }

    try {
      const res = await fetch("/api/partner/rewards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || t("Erro ao carregar produtos"));
        setProducts([]);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch {
      setError(t("Erro de ligação ao servidor"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !points || !stock) {
      setError(t("Nome, pontos e stock são obrigatórios"));
      return;
    }

    if (!token) {
      setError(t("Sessão inválida"));
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/partner/rewards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description,
        points: Number(points),
        stock: Number(stock),
        image_url: imageUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setSubmitting(false);
      setError(data?.error || t("Erro ao criar produto"));
      return;
    }

    setName("");
    setDescription("");
    setPoints("");
    setStock("");
    setImageUrl("");
    setSubmitting(false);
    setFormOpen(false);
    loadProducts();
  };

  const updateProduct = async (id: number, updates: Partial<Reward>) => {
    if (!token) return;

    const res = await fetch(`/api/partner/rewards/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      loadProducts();
    }
  };

  const deleteProduct = async (id: number) => {
    if (!token) return;
    if (!confirm(t("Remover produto?"))) return;

    const res = await fetch(`/api/partner/rewards/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      loadProducts();
    }
  };

  const [formOpen, setFormOpen] = useState(false);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
  const averagePoints = totalProducts > 0
    ? Math.round(products.reduce((sum, product) => sum + (Number(product.points) || 0), 0) / totalProducts)
    : 0;
  const lowStockProducts = products.filter((product) => Number(product.stock) <= 5).length;

  const shellCardStyle = {
    backgroundColor: "var(--bg-card)",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid var(--border)",
  } as const;

  return (
    <div style={{ display: "grid", gap: 24, minWidth: 0 }}>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { label: t("Produtos"), value: totalProducts, tone: "#0f766e" },
          { label: t("Stock total"), value: totalStock, tone: "#0f766e" },
          { label: t("Média de pontos"), value: averagePoints, tone: "#7c3aed" },
          { label: t("Stock baixo"), value: lowStockProducts, tone: "#b45309" },
        ].map((item) => (
          <div key={item.label} style={{ ...shellCardStyle, padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>{item.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: item.tone }}>{item.value}</div>
          </div>
        ))}
      </section>

      {/* Table — main section */}
      <div style={{ ...shellCardStyle, padding: 24, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, color: "var(--text-main)" }}>{t("Catálogo atual")}</h3>
            <p style={{ margin: "8px 0 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
              {t("Atualiza pontos e stock diretamente na tabela.")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: "#dcfce7",
                color: "#166534",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {totalProducts} {t("itens")}
            </div>
            <button
              onClick={() => setFormOpen(true)}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #0f766e",
                backgroundColor: "#0f766e",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t("Adicionar produto")}
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>{t("A carregar produtos...")}</p>
        ) : products.length === 0 ? (
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 10,
              padding: 28,
              textAlign: "center",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-secondary, #f8fafc)",
            }}
          >
            {t("Ainda não tens produtos registados.")}
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary, #edf3fb)" }}>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{t("Produto")}</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{t("Estado")}</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{t("Pontos")}</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{t("Stock")}</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{t("Ações")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <FallbackImage
                          src={p.image_url || ""}
                          alt={p.name}
                          style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, background: "var(--bg-secondary, #f1f5f9)" }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>{p.name}</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{p.description || t("Sem descrição")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                        backgroundColor: p.status === "approved" ? "#dcfce7" : p.status === "pending" ? "#fef3c7" : "#fee2e2",
                        color: p.status === "approved" ? "#166534" : p.status === "pending" ? "#92400e" : "#991b1b",
                      }}>
                        {p.status === "approved" ? t("Aprovado") : p.status === "pending" ? t("Pendente") : t("Rejeitado")}
                      </span>
                    </td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      <input
                        type="number"
                        min={0}
                        value={p.points}
                        onChange={(e) =>
                          setProducts((curr) =>
                            curr.map((item) => (item.id === p.id ? { ...item, points: Number(e.target.value) } : item))
                          )
                        }
                        onBlur={() => updateProduct(p.id, { points: p.points })}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      <input
                        type="number"
                        min={0}
                        value={p.stock}
                        onChange={(e) =>
                          setProducts((curr) =>
                            curr.map((item) => (item.id === p.id ? { ...item, stock: Number(e.target.value) } : item))
                          )
                        }
                        onBlur={() => updateProduct(p.id, { stock: p.stock })}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #dc2626",
                          backgroundColor: "#dc2626",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {t("Apagar")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add product modal */}
      {formOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(2,6,23,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
          onClick={() => setFormOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
              padding: 24,
              display: "grid",
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--text-main)" }}>{t("Adicionar produto")}</h3>
              <button
                onClick={() => setFormOpen(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={createProduct} style={{ display: "grid", gap: 12 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Nome do produto")} />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("Descrição")}
                style={{ minHeight: 80, resize: "vertical" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input value={points} onChange={(e) => setPoints(e.target.value)} type="number" min={0} placeholder={t("Pontos")} />
                <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min={0} placeholder={t("Stock")} />
              </div>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t("URL da imagem (opcional)")} />
              {error && <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid #0f766e",
                  backgroundColor: submitting ? "#5eead4" : "#0f766e",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? t("A guardar...") : t("Adicionar produto")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
