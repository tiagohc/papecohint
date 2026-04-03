"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Partner = { id: number; name: string };

export default function NewRewardPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [partnerId, setPartnerId] = useState<number | "">("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:8000/admin/partners", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPartners(data))
      .catch(console.error);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !points || !stock || partnerId === "") {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/admin/rewards", {
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
          image_url: imageUrl || null,
          partner_id: Number(partnerId),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return setError(data.error || "Erro ao criar reward");

      router.push("/admin/rewards");
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Erro de ligação ao servidor");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>Novo Reward</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Pontos"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="URL da imagem"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <select
          value={partnerId}
          onChange={(e) =>
            setPartnerId(e.target.value === "" ? "" : Number(e.target.value))
          }
          required
        >
          <option value="">Selecionar parceiro</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Reward"}
        </button>
      </form>
    </div>
  );
}