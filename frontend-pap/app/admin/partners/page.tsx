"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";
import {
  adminFormGridStyle,
  adminInputStyle,
  adminModalBackdropStyle,
  adminModalCardStyle,
} from "../components/formStyles";
import {
  adminActionDangerButtonStyle,
  adminActionPrimaryButtonStyle,
  adminActionSecondaryButtonStyle,
  adminTableCellStyle,
  adminTableContainerStyle,
  adminTableHeaderCellStyle,
  adminTableHeadRowStyle,
  adminTableRowStyle,
  adminTableStyle,
  adminTopActionButtonStyle,
} from "../components/tableStyles";

type Partner = {
  id: number;
  name: string;
  description?: string;
  active?: number;
  partner_user_id?: number | null;
  partner_account_email?: string;
};

export default function PartnersPage() {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerDescription, setNewPartnerDescription] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  const fetchPartners = () => {
    if (!token) return;
    fetch("/api/admin/partners", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setPartners)
      .catch(console.error);
  };

  useEffect(() => { fetchPartners(); }, [token]);

  const handleDeletePartner = async (id: number) => {
    if (!confirm(t("Apagar parceiro?"))) return;
    await fetch(`/api/admin/partners/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPartners();
  };

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) return;
    if (!accountEmail.trim() || !accountPassword.trim()) {
      alert(t("Email e password da conta do parceiro são obrigatórios"));
      return;
    }

    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newPartnerName,
        description: newPartnerDescription,
        account_name: accountName || undefined,
        account_email: accountEmail || undefined,
        account_password: accountPassword || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || t("Erro ao criar parceiro"));
      return;
    }

    setNewPartnerName("");
    setNewPartnerDescription("");
    setAccountName("");
    setAccountEmail("");
    setAccountPassword("");
    setModalOpen(false);
    fetchPartners();
  };

  const handleCreateAccountForExistingPartner = async (partnerId: number) => {
    const email = prompt(t("Email da conta do parceiro:"));
    if (!email) return;

    const password = prompt(t("Password da conta do parceiro:"));
    if (!password) return;

    const displayName = prompt(t("Nome da conta (opcional):")) || undefined;

    const res = await fetch(`/api/admin/partners/${partnerId}/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        account_name: displayName,
        account_email: email,
        account_password: password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || t("Erro ao associar conta ao parceiro"));
      return;
    }

    alert(t("Conta associada com sucesso"));
    fetchPartners();
  };

  const filteredPartners = partners.filter((p) => {
    if (statusFilter === "active") return Boolean(p.partner_user_id);
    if (statusFilter === "inactive") return !p.partner_user_id;
    return true;
  });

  return (
    <div style={{ padding: 40 }}>
      <h1>{t("Parceiros")}</h1>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setStatusFilter("all")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            backgroundColor: statusFilter === "all" ? "#1f2937" : "var(--bg-card)",
            color: statusFilter === "all" ? "#fff" : "var(--text-main)",
            cursor: "pointer",
          }}
        >
          {t("Todos")}
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            backgroundColor: statusFilter === "active" ? "#166534" : "var(--bg-card)",
            color: statusFilter === "active" ? "#fff" : "var(--text-main)",
            cursor: "pointer",
          }}
        >
          {t("Só com conta ativa")}
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            backgroundColor: statusFilter === "inactive" ? "#991b1b" : "var(--bg-card)",
            color: statusFilter === "inactive" ? "#fff" : "var(--text-main)",
            cursor: "pointer",
          }}
        >
          {t("Só sem acesso")}
        </button>
        <button
          onClick={() => setModalOpen(true)}
          style={adminTopActionButtonStyle}
        >
          {t("Novo Parceiro")}
        </button>
      </div>
      <div style={adminTableContainerStyle}>
        <table style={adminTableStyle}>
          <thead>
            <tr style={adminTableHeadRowStyle}>
              <th style={adminTableHeaderCellStyle}>{t("ID")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Nome")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Conta Parceiro")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Estado")}</th>
              <th style={adminTableHeaderCellStyle}>{t("Ações")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.map((p, idx) => (
              <tr key={p.id} style={adminTableRowStyle(idx)}>
                <td style={adminTableCellStyle}>{p.id}</td>
                <td style={adminTableCellStyle}>{p.name}</td>
                <td style={adminTableCellStyle}>{p.partner_account_email || t("Sem conta")}</td>
                <td style={adminTableCellStyle}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: p.partner_user_id ? "#dcfce7" : "#fee2e2",
                    color: p.partner_user_id ? "#166534" : "#991b1b",
                  }}
                >
                  {p.partner_user_id ? t("Conta ativa") : t("Sem acesso")}
                </span>
                </td>
                <td style={adminTableCellStyle}>
                  <button onClick={() => router.push(`/admin/partners/${p.id}`)} style={adminActionSecondaryButtonStyle}>{t("Ver Produtos")}</button>
                  {!p.partner_user_id && (
                    <button
                      onClick={() => handleCreateAccountForExistingPartner(p.id)}
                      style={{ ...adminActionPrimaryButtonStyle, marginLeft: 10 }}
                    >
                      {t("Criar Conta")}
                    </button>
                  )}
                  <button onClick={() => handleDeletePartner(p.id)} style={{ ...adminActionDangerButtonStyle, marginLeft: 10 }}>{t("Apagar")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div style={adminModalBackdropStyle}>
          <div style={{ ...adminModalCardStyle, maxWidth: 480 }}>
            <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18 }}>{t("Novo Parceiro")}</h2>
            <div style={adminFormGridStyle}>
              <input
                type="text"
                placeholder={t("Nome do Parceiro")}
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                style={adminInputStyle}
              />
              <input
                type="text"
                placeholder={t("Descrição (opcional)")}
                value={newPartnerDescription}
                onChange={(e) => setNewPartnerDescription(e.target.value)}
                style={adminInputStyle}
              />
              <input
                type="text"
                placeholder={t("Nome da Conta (opcional)")}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                style={adminInputStyle}
              />
              <input
                type="email"
                placeholder={t("Email da Conta *")}
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                required
                style={adminInputStyle}
              />
              <input
                type="password"
                placeholder={t("Password da Conta *")}
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                required
                style={adminInputStyle}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleAddPartner} style={adminTopActionButtonStyle}>{t("Adicionar Parceiro")}</button>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", cursor: "pointer" }}
                >
                  {t("Cancelar")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}