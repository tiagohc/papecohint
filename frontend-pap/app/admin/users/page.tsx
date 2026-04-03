"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [status, setStatus] = useState("active");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsers = () => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    fetch("http://localhost:8000/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
      setPassword(""); // não mostrar senha
    } else {
      setEditingUser(null);
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setStatus("active");
    }
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const body: any = { name, email, role, status };
    if (!editingUser) {
      if (!password) return alert("Preencha a senha");
      body.password = password;
    } else if (password) {
      body.password = password;
    }

    const method = editingUser ? "PUT" : "POST";
    const url = editingUser
      ? `http://localhost:8000/admin/users/${editingUser.id}`
      : "http://localhost:8000/admin/users";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        return alert(errData.error || "Erro no servidor");
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    }
  };

  const deleteUser = async (id: number) => {
    if (!token) return;
    if (!confirm("Deseja realmente deletar este usuário?")) return;

    try {
      await fetch(`http://localhost:8000/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar usuário");
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40 }}>
        <p>Carregando usuários...</p>
      </div>
    );

  return (
    <div style={{ padding: 40 }}>
      <h1>Painel de Admin - Usuários</h1>
      <button
        onClick={() => openModal()}
        style={{ marginBottom: 20, padding: "8px 16px", backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: 5 }}
      >
        Novo Usuário
      </button>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ backgroundColor: "#f0f0f0", marginBottom: 4 }}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                <button onClick={() => openModal(u)} style={{ marginRight: 8 }}>Editar</button>
                <button onClick={() => deleteUser(u.id)} style={{ backgroundColor: "#e53935", color: "#fff" }}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form
            onSubmit={handleSubmit}
            style={{ backgroundColor: "#fff", padding: 20, borderRadius: 8, display: "flex", flexDirection: "column", minWidth: 300 }}
          >
            <h2>{editingUser ? "Editar Usuário" : "Novo Usuário"}</h2>

            <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required style={{ marginBottom: 10 }} />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 10 }} />
            <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 10 }} />
            
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: 10 }}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 10 }}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={closeModal}>Cancelar</button>
              <button type="submit">{editingUser ? "Salvar" : "Criar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
