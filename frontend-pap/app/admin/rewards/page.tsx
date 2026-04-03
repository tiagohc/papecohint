"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Reward = {
  id: number;
  name: string;
  description: string;
  points: number;
  stock: number;
  image_url: string;
  partner_name: string;
};

export default function AdminRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchRewards = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/admin/rewards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("fetchRewards response", res.status, data);
      setRewards(Array.isArray(data) ? data : []); // garante array
      setLoading(false);
    } catch (err) {
      console.error("fetchRewards failed", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const deleteReward = async (id: number) => {
    if (!token) return;
    if (!confirm("Tem a certeza que quer remover este reward?")) return;
    try {
      await fetch(`http://localhost:8000/admin/rewards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRewards();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40, color: "#1e293b" }}>
        <p>Carregando rewards...</p>
      </div>
    );

  return (
    <div style={{ padding: 40, backgroundColor: "#f0fdf4", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e293b", marginBottom: 20 }}>Painel Admin - Rewards</h1>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1e293b", color: "#fff" }}>
              <th>ID</th>
              <th>Nome</th>
              <th>Parceiro</th>
              <th>Pontos</th>
              <th>Stock</th>
              <th>Foto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r, i) => (
              <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "#f0fdf4" : "#d9f2d9" }}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.partner_name}</td>
                <td>{r.points}</td>
                <td>{r.stock}</td>
                <td>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 5 }} />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button
                    onClick={() => router.push(`/admin/rewards/${r.id}`)}
                    style={{ marginRight: 8, padding: "6px 12px", backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: 5 }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteReward(r.id)}
                    style={{ padding: "6px 12px", backgroundColor: "#e53935", color: "#fff", border: "none", borderRadius: 5 }}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        style={{
          marginTop: 20,
          padding: "12px 20px",
          backgroundColor: "#2e7d32",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
        onClick={() => router.push("/admin/rewards/new")}
      >
        Novo Reward
      </button>
    </div>
  );
}
