"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
    fetch(`http://localhost:8000/admin/partners/${partnerId}/products`, {
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
    await fetch(`http://localhost:8000/admin/partners/${partnerId}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProducts();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPoints || !newStock) return;

    setAdding(true);
    await fetch("http://localhost:8000/admin/rewards", {
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
    await fetch(`http://localhost:8000/admin/partners/${partnerId}/products/${id}`, {
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
      <form onSubmit={handleAddProduct} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome do Produto"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descrição"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Pontos"
          value={newPoints}
          onChange={(e) => setNewPoints(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Stock"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="URL da Imagem"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
        />
        <button type="submit" disabled={adding}>
          {adding ? "Adicionando..." : "Adicionar Produto"}
        </button>
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Pontos</th>
            <th>Stock</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.points}</td>
              <td>
                <input
                  type="number"
                  value={p.stock}
                  onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
              <td>
                <button onClick={() => handleDelete(p.id)}>Apagar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}