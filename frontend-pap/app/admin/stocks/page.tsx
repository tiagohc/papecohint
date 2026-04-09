"use client";
import { useEffect, useState } from "react";
import {
  adminTableInputStyle,
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
} from "../components/tableStyles";

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
    fetch(`/api/admin/rewards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(console.error);
  };

  useEffect(() => { fetchProducts(); }, [token]);

  const handleStockChange = async (id: number, stock: number) => {
    if (!token) return;
    await fetch(`/api/admin/rewards/${id}`, {
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
      <div style={adminTableContainerStyle}>
        <table style={adminTableStyle}>
          <thead>
            <tr style={adminTableHeadRowStyle}>
              <th style={adminTableHeaderCellStyle}>ID</th>
              <th style={adminTableHeaderCellStyle}>Nome</th>
              <th style={adminTableHeaderCellStyle}>Parceiro</th>
              <th style={adminTableHeaderCellStyle}>Pontos</th>
              <th style={adminTableHeaderCellStyle}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.id} style={adminTableRowStyle(idx)}>
                <td style={adminTableCellStyle}>{p.id}</td>
                <td style={adminTableCellStyle}>{p.name}</td>
                <td style={adminTableCellStyle}>{p.partner_name}</td>
                <td style={adminTableCellStyle}>{p.points}</td>
                <td style={adminTableCellStyle}>
                <input
                  type="number"
                  value={p.stock}
                  onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                  style={adminTableInputStyle}
                />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}