"use client";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  description?: string;
  points: number;
  stock: number;
  image_url?: string;
  partner_name?: string;
};

export default function StocksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchProducts = () => {
    if (!token) return;
    fetch(`http://localhost:8000/admin/rewards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(console.error);
  };

  useEffect(() => { fetchProducts(); }, [token]);

  const handleStockChange = async (id: number, stock: number) => {
    if (!token) return;
    await fetch(`http://localhost:8000/admin/rewards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock }),
    });
    fetchProducts();
  };

  if (loading) return <p>Carregando produtos...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Gestão de Stocks</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Parceiro</th>
            <th>Pontos</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.partner_name}</td>
              <td>{p.points}</td>
              <td>
                <input
                  type="number"
                  value={p.stock}
                  onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}