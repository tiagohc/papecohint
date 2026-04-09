"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

type Reward = {
  id: number;
  name: string;
  description?: string;
  points: number;
  stock: number;
  image_url?: string;
};

export default function PartnerPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Reward[]>([]);
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

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
  const averagePoints = totalProducts > 0
    ? Math.round(products.reduce((sum, product) => sum + (Number(product.points) || 0), 0) / totalProducts)
    : 0;
  const lowStockProducts = products.filter((product) => Number(product.stock) <= 5).length;

  const shellCardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  } as const;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section
        style={{
          ...shellCardStyle,
          padding: 28,
          background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #99f6e4 100%)",
          color: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 620 }}>
            <p style={{ margin: 0, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.88 }}>
              {t("Gestão do parceiro")}
            </p>
            <h2 style={{ margin: "10px 0 12px 0", fontSize: 34, lineHeight: 1.15 }}>
              {t("Controla o catálogo e define os pontos dos teus produtos.")}
            </h2>
            <p style={{ margin: 0, maxWidth: 560, color: "rgba(248,250,252,0.88)", lineHeight: 1.6 }}>
              {t("Cria novos artigos, ajusta os pontos em tempo real e acompanha rapidamente o stock mais baixo.")}
            </p>
          </div>

          <div
            style={{
              minWidth: 240,
              padding: 18,
              borderRadius: 16,
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>{t("Estado rápido")}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{totalProducts}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{t("produtos publicados")}</div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { label: t("Produtos"), value: totalProducts, tone: "#0f766e" },
          { label: t("Stock total"), value: totalStock, tone: "#0369a1" },
          { label: t("Média de pontos"), value: averagePoints, tone: "#7c3aed" },
          { label: t("Stock baixo"), value: lowStockProducts, tone: "#b45309" },
        ].map((item) => (
          <div key={item.label} style={{ ...shellCardStyle, padding: 20 }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>{item.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: item.tone }}>{item.value}</div>
          </div>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ ...shellCardStyle, padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>{t("Adicionar produto")}</h3>
            <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: 14 }}>
              {t("Define o nome, a descrição, os pontos e o stock inicial do novo produto.")}
            </p>
          </div>

          <form onSubmit={createProduct} style={{ display: "grid", gap: 12 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Nome do produto")} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("Descrição")}
              style={{ minHeight: 110, resize: "vertical" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input value={points} onChange={(e) => setPoints(e.target.value)} type="number" min={0} placeholder={t("Pontos")} />
              <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min={0} placeholder={t("Stock")} />
            </div>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t("URL da imagem (opcional)")} />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {submitting ? t("A guardar...") : t("Adicionar produto")}
            </button>
          </form>

          {error && <p style={{ color: "#b91c1c", marginTop: 14 }}>{error}</p>}
        </div>

        <div style={{ ...shellCardStyle, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>{t("Catálogo atual")}</h3>
              <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: 14 }}>
                {t("Atualiza pontos e stock diretamente na tabela.")}
              </p>
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                backgroundColor: "#ecfeff",
                color: "#0f766e",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {totalProducts} {t("itens")}
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#64748b" }}>{t("A carregar produtos...")}</p>
          ) : products.length === 0 ? (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 16,
                padding: 28,
                textAlign: "center",
                color: "#64748b",
                backgroundColor: "#f8fafc",
              }}
            >
              {t("Ainda não tens produtos registados. Usa o formulário ao lado para publicar o primeiro.")}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", padding: 12 }}>{t("Produto")}</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", padding: 12 }}>{t("Pontos")}</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", padding: 12 }}>{t("Stock")}</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", padding: 12 }}>{t("Ações")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ borderBottom: "1px solid #edf2f7", padding: 12 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{p.name}</div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>{p.description || t("Sem descrição")}</div>
                      </td>
                      <td style={{ borderBottom: "1px solid #edf2f7", padding: 12 }}>
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
                          style={{ width: 110 }}
                        />
                      </td>
                      <td style={{ borderBottom: "1px solid #edf2f7", padding: 12 }}>
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
                          style={{ width: 110 }}
                        />
                      </td>
                      <td style={{ borderBottom: "1px solid #edf2f7", padding: 12 }}>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            fontWeight: 700,
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
      </section>
    </div>
  );
}
