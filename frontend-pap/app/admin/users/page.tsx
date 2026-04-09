"use client";

import { useEffect, useState } from "react";
import {
  adminFormGridStyle,
  adminInputStyle,
  adminModalBackdropStyle,
  adminModalCardStyle,
  adminSelectStyle,
} from "../components/formStyles";
import { useLanguage } from "@/app/components/LanguageProvider";
import {
  adminActionDangerButtonStyle,
  adminActionSecondaryButtonStyle,
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
  adminTopActionButtonStyle,
} from "../components/tableStyles";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  is_premium: number;
};

export default function AdminUsers() {
  const { t } = useLanguage();
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

  const adminUsersUrl = () => `/api/admin/users?ts=${Date.now()}`;

  const fetchUsers = () => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    fetch(adminUsersUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
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
      if (!password) return alert(t("Preencha a senha"));
      body.password = password;
    } else if (password) {
      body.password = password;
    }

    const method = editingUser ? "PUT" : "POST";
    const url = editingUser
      ? `/api/admin/users/${editingUser.id}`
      : "/api/admin/users";

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
        return alert(errData.error || t("Erro no servidor"));
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(t("Erro de conexão"));
    }
  };

  const deleteUser = async (id: number) => {
    if (!token) return;
    if (!confirm(t("Deseja realmente deletar este usuário?"))) return;

    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(t("Erro ao deletar usuário"));
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40 }}>
        <p>{t("Carregando usuários...")}</p>
      </div>
    );

  return (
    <div style={{ padding: 40 }}>
      <h1>{t("Painel de Admin - Usuários")}</h1>
      <button
        onClick={() => openModal()}
        style={{ ...adminTopActionButtonStyle, marginBottom: 20 }}
      >
        {t("Novo Usuário")}
      </button>

      <div style={adminTableContainerStyle}>
        <table style={adminTableStyle}>
          <thead>
            <tr style={adminTableHeadRowStyle}>
              <th style={adminTableHeaderCellStyle}>{t("ID")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Nome")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Email")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Role")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Premium")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Status")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Ações")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} style={adminTableRowStyle(idx)}>
                <td style={adminTableCellStyle}>{u.id}</td>
                <td style={adminTableCellStyle}>{u.name}</td>
                <td style={adminTableCellStyle}>{u.email}</td>
                <td style={adminTableCellStyle}>{u.role}</td>
                <td style={adminTableCellStyle}>
                  {u.role === "user" ? (
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: "bold",
                      backgroundColor: u.is_premium ? "#fef3c7" : "#f3f4f6",
                      color: u.is_premium ? "#92400e" : "#6b7280",
                    }}>
                      {u.is_premium ? t("Sim") : t("Não")}
                    </span>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={adminTableCellStyle}>{u.status}</td>
                <td style={adminTableCellStyle}>
                  <button onClick={() => openModal(u)} style={{ ...adminActionSecondaryButtonStyle, marginRight: 8 }}>{t("Editar")}</button>
                  <button onClick={() => deleteUser(u.id)} style={adminActionDangerButtonStyle}>{t("Deletar")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={adminModalBackdropStyle}>
          <form
            onSubmit={handleSubmit}
            style={adminModalCardStyle}
          >
            <h2>{editingUser ? t("Editar Usuário") : t("Novo Usuário")}</h2>

            <div style={adminFormGridStyle}>
              <input placeholder={t("Nome")} value={name} onChange={(e) => setName(e.target.value)} required style={adminInputStyle} />
              <input placeholder={t("Email")} value={email} onChange={(e) => setEmail(e.target.value)} required style={adminInputStyle} />
              <input placeholder={t("Senha")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={adminInputStyle} />
            
              <select value={role} onChange={(e) => setRole(e.target.value)} style={adminSelectStyle}>
                <option value="user">user</option>
                <option value="partner">partner</option>
                <option value="admin">admin</option>
              </select>

              <select value={status} onChange={(e) => setStatus(e.target.value)} style={adminSelectStyle}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={closeModal}>{t("Cancelar")}</button>
              <button type="submit">{editingUser ? t("Salvar") : t("Criar")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
