"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  adminFormCardStyle,
  adminFormRowStyle,
  adminInputStyle,
} from "../../components/formStyles";
import {
  adminActionDangerButtonStyle,
  adminTableInputStyle,
  adminTopActionButtonStyle,
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
} from "../../components/tableStyles";

type Product = {
  id: number;
  name: string;
  description?: string;
  points: number;
  stock: number;
  image_url?: string;
};

export default function PartnerProductsPage() {
  const params = useParams();
  const partnerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  // Form states for adding new product
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchProducts = () => {
    if (!token) return;
    fetch(`/api/admin/partners/${partnerId}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(console.error);
  };

  useEffect(() => { fetchProducts(); }, [partnerId, token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("Apagar produto?")) return;
    await fetch(`/api/admin/partners/${partnerId}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProducts();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPoints || !newStock) return;

    setAdding(true);
    await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newName,
        description: newDescription,
        points: Number(newPoints),
        stock: Number(newStock),
        image_url: newImageUrl,
        partner_id: Number(partnerId),
      }),
    });
    setNewName("");
    setNewDescription("");
    setNewPoints("");
    setNewStock("");
    setNewImageUrl("");
    setAdding(false);
    fetchProducts();
  };

  const handleStockChange = async (id: number, stock: number) => {
    if (!token) return;
    await fetch(`/api/admin/partners/${partnerId}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock }),
    });
    fetchProducts();
  };

  if (loading) return <p>Carregando produtos...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Produtos do Parceiro {partnerId}</h1>
      <form onSubmit={handleAddProduct} style={{ ...adminFormCardStyle, ...adminFormRowStyle, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome do Produto"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          style={adminInputStyle}
        />
        <input
          type="text"
          placeholder="Descrição"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={adminInputStyle}
        />
        <input
          type="number"
          placeholder="Pontos"
          value={newPoints}
          onChange={(e) => setNewPoints(e.target.value)}
          required
          style={adminInputStyle}
        />
        <input
          type="number"
          placeholder="Stock"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          required
          style={adminInputStyle}
        />
        <input
          type="text"
          placeholder="URL da Imagem"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          style={adminInputStyle}
        />
        <button type="submit" disabled={adding} style={adminTopActionButtonStyle}>
          {adding ? "Adicionando..." : "Adicionar Produto"}
        </button>
      </form>
      <div style={adminTableContainerStyle}>
        <table style={adminTableStyle}>
          <thead>
            <tr style={adminTableHeadRowStyle}>
              <th style={adminTableHeaderCellStyle}>ID</th>
              <th style={adminTableHeaderCellStyle}>Nome</th>
              <th style={adminTableHeaderCellStyle}>Pontos</th>
              <th style={adminTableHeaderCellStyle}>Stock</th>
              <th style={adminTableHeaderCellStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.id} style={adminTableRowStyle(idx)}>
                <td style={adminTableCellStyle}>{p.id}</td>
                <td style={adminTableCellStyle}>{p.name}</td>
                <td style={adminTableCellStyle}>{p.points}</td>
                <td style={adminTableCellStyle}>
                <input
                  type="number"
                  value={p.stock}
                  onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                  style={adminTableInputStyle}
                />
                </td>
                <td style={adminTableCellStyle}>
                  <button onClick={() => handleDelete(p.id)} style={adminActionDangerButtonStyle}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}