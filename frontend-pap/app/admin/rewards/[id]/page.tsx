"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  adminErrorTextStyle,
  adminFormCardStyle,
  adminFormGridStyle,
  adminInputStyle,
  adminSelectStyle,
  adminTextareaStyle,
} from "../../components/formStyles";
import { adminTopActionButtonStyle } from "../../components/tableStyles";
import { useLanguage } from "@/app/components/LanguageProvider";

type Partner = { id: number; name: string };

export default function EditRewardPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const rewardId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [partnerId, setPartnerId] = useState<number | "">("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token || !rewardId) return;

    fetch(`/api/admin/rewards/${rewardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || "");
        setDescription(data.description || "");
        setPoints(String(data.points));
        setStock(String(data.stock));
        setImageUrl(data.image_url || "");
        setPartnerId(data.partner_id);
        setLoading(false);
      })
      .catch(() => {
        setError(t("Erro ao carregar recompensa"));
        setLoading(false);
      });

    fetch("/api/admin/partners", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPartners(data))
      .catch(console.error);
  }, [rewardId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || points === "" || stock === "" || partnerId === "") {
      setError(t("Preenche todos os campos obrigatórios"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/rewards/${rewardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          points: Number(points),
          stock: Number(stock),
          image_url: imageUrl || null,
          partner_id: Number(partnerId),
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) return setError(data.error || t("Erro ao atualizar"));

      router.push("/admin/rewards");
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError(t("Erro de ligação ao servidor"));
    }
  };

  if (loading) return <p>{t("A carregar recompensa...")}</p>;

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>{t("Editar Recompensa")}</h1>

      {error && <p style={adminErrorTextStyle}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ ...adminFormCardStyle, ...adminFormGridStyle }}>
        <input type="text" placeholder={t("Nome")} value={name} onChange={(e) => setName(e.target.value)} required style={adminInputStyle} />
        <textarea placeholder={t("Descrição")} value={description} onChange={(e) => setDescription(e.target.value)} style={adminTextareaStyle} />
        <input type="number" placeholder={t("Pontos")} value={points} onChange={(e) => setPoints(e.target.value)} required style={adminInputStyle} />
        <input type="number" placeholder={t("Stock")} value={stock} onChange={(e) => setStock(e.target.value)} required style={adminInputStyle} />
        <input type="text" placeholder={t("URL da imagem (opcional)")} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={adminInputStyle} />
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value === "" ? "" : Number(e.target.value))} required style={adminSelectStyle}>
          <option value="">{t("Selecionar parceiro")}</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="submit" disabled={saving} style={adminTopActionButtonStyle}>
          {saving ? t("A atualizar...") : t("Atualizar Recompensa")}
        </button>
      </form>
    </div>
  );
}