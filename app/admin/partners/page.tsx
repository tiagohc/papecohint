"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Partner = { id: number; name: string; description?: string; active?: number };

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerDescription, setNewPartnerDescription] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  const fetchPartners = () => {
    if (!token) return;
    fetch("http://localhost:8000/admin/partners", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setPartners)
      .catch(console.error);
  };

  useEffect(() => { fetchPartners(); }, [token]);

  const handleDeletePartner = async (id: number) => {
    if (!confirm("Apagar parceiro?")) return;
    await fetch(`http://localhost:8000/admin/partners/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPartners();
  };

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) return;
    await fetch("http://localhost:8000/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newPartnerName, description: newPartnerDescription }),
    });
    setNewPartnerName("");
    setNewPartnerDescription("");
    fetchPartners();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Parceiros</h1>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome do Parceiro"
          value={newPartnerName}
          onChange={(e) => setNewPartnerName(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={newPartnerDescription}
          onChange={(e) => setNewPartnerDescription(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <button onClick={handleAddPartner}>Adicionar Parceiro</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {partners.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>
                <button onClick={() => router.push(`/admin/partners/${p.id}`)}>Ver Produtos</button>
                <button onClick={() => handleDeletePartner(p.id)} style={{ marginLeft: 10, color: "red" }}>Apagar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}