"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

type EnergyInvoice = {
  id: number;
  name_detected: string | null;
  kwh: number | null;
  period_start: string | null;
  period_end: string | null;
  entity: string | null;
  confidence: number;
  file_path: string | null;
  status: "pending_confirmation" | "confirmed" | "rejected";
  created_at: string;
  confirmed_at: string | null;
};

type UploadResult = {
  invoice: EnergyInvoice;
  confidence_label: "alto" | "médio" | "baixo";
};

type ConfirmResult = {
  invoice: EnergyInvoice;
  overlap_warning: string | null;
  missions_completed: { id: number; title: string; points: number }[];
  points_awarded: number;
};

type Alias = { id: number; name: string };

type Step = "idle" | "review" | "success";

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 10,
  backgroundColor: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  marginBottom: 20,
};

const CONFIDENCE_COLORS: Record<string, string> = { alto: "#16a34a", médio: "#d97706", baixo: "#dc2626" };

function formatDate(str: string | null) {
  if (!str) return "–";
  return new Date(str).toLocaleDateString("pt-PT");
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FaturasPage() {
  const { t } = useLanguage();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [invoices, setInvoices] = useState<EnergyInvoice[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);

  // Aliases
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [showAliases, setShowAliases] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [addingAlias, setAddingAlias] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  // ──────────────────────────────────────────
  // Load invoice list + aliases
  // ──────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    fetch("/api/user/energy-invoices", { headers })
      .then((r) => r.json())
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingList(false));

    fetch("/api/user/aliases", { headers })
      .then((r) => r.json())
      .then((data) => setAliases(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  // ──────────────────────────────────────────
  // Upload
  // ──────────────────────────────────────────

  async function handleUpload() {
    if (!selectedFile || !token) return;
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("invoice", selectedFile);

    try {
      const res = await fetch("/api/user/energy-invoices/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details ? `${data.error}: ${(data.details as string[]).join("; ")}` : data.error;
        setUploadError(msg || "Erro ao enviar fatura");
      } else {
        setUploadResult(data as UploadResult);
        setStep("review");
        setSelectedFile(null);
      }
    } catch {
      setUploadError("Erro de ligação ao servidor");
    } finally {
      setIsUploading(false);
    }
  }

  // ──────────────────────────────────────────
  // Confirm
  // ──────────────────────────────────────────

  async function handleConfirm() {
    if (!uploadResult || !token) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/user/energy-invoices/${uploadResult.invoice.id}/confirm`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Erro ao confirmar fatura");
        return;
      }
      const result = data as ConfirmResult;
      setConfirmResult(result);
      setStep("success");

      if (result.points_awarded > 0 && typeof window !== "undefined") {
        const stored = localStorage.getItem("ecohint-points");
        const current = stored ? Number(stored) : 0;
        localStorage.setItem("ecohint-points", String(current + result.points_awarded));
      }

      setInvoices((prev) => {
        const exists = prev.find((i) => i.id === result.invoice.id);
        if (exists) return prev.map((inv) => (inv.id === result.invoice.id ? result.invoice : inv));
        return [result.invoice, ...prev];
      });
    } catch {
      setUploadError("Erro de ligação ao servidor");
    } finally {
      setIsConfirming(false);
    }
  }

  // ──────────────────────────────────────────
  // Reject pending
  // ──────────────────────────────────────────

  async function handleReject(id: number) {
    if (!token) return;
    await fetch(`/api/user/energy-invoices/${id}`, { method: "DELETE", headers });
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (uploadResult?.invoice.id === id) {
      setStep("idle");
      setUploadResult(null);
    }
  }

  // ──────────────────────────────────────────
  // Aliases
  // ──────────────────────────────────────────

  async function handleAddAlias() {
    if (!newAlias.trim() || !token) return;
    setAddingAlias(true);
    try {
      const res = await fetch("/api/user/aliases", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAlias.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAliases((prev) => [...prev, data as Alias]);
        setNewAlias("");
      }
    } catch { /* silent */ } finally {
      setAddingAlias(false);
    }
  }

  async function handleRemoveAlias(id: number) {
    if (!token) return;
    await fetch(`/api/user/aliases/${id}`, { method: "DELETE", headers });
    setAliases((prev) => prev.filter((a) => a.id !== id));
  }

  // ──────────────────────────────────────────
  // Status badge helper
  // ──────────────────────────────────────────

  const statusBadge = (status: EnergyInvoice["status"]) => {
    const map: Record<EnergyInvoice["status"], { label: string; color: string; bg: string }> = {
      pending_confirmation: { label: "Pendente", color: "#d97706", bg: "#fef3c7" },
      confirmed: { label: "Confirmada", color: "#16a34a", bg: "#dcfce7" },
      rejected: { label: "Rejeitada", color: "#dc2626", bg: "#fee2e2" },
    };
    const s = map[status];
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={cardStyle}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: 22 }}>{t("Faturas de Energia")}</h1>
        <p style={{ margin: 0, color: "#555" }}>
          {t("Envia a tua fatura de energia (PDF ou imagem). O sistema extrai automaticamente o consumo e valida as tuas missões.")}
        </p>
      </div>

      {/* ── STEP: IDLE — Upload form ── */}
      {step === "idle" && (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 17 }}>{t("Enviar fatura")}</h2>

          {uploadError && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", marginBottom: 14, fontSize: 14 }}>
              {uploadError}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{
              padding: "14px 18px", borderRadius: 8, border: "2px dashed #22c55e",
              backgroundColor: "#f0fff4", cursor: "pointer", display: "inline-flex",
              alignItems: "center", gap: 10, fontWeight: 500,
            }}>
              {selectedFile ? selectedFile.name : t("Escolher ficheiro")}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
                style={{ display: "none" }}
                onChange={(e) => { setSelectedFile(e.target.files?.[0] ?? null); setUploadError(null); }}
              />
            </label>

            {selectedFile && (
              <span style={{ fontSize: 13, color: "#666" }}>{formatSize(selectedFile.size)}</span>
            )}

            <button
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              style={{
                padding: "14px 22px", borderRadius: 8, border: "none",
                backgroundColor: selectedFile && !isUploading ? "#22c55e" : "#94a3b8",
                color: "white", fontWeight: 600, cursor: selectedFile && !isUploading ? "pointer" : "not-allowed",
              }}
            >
              {isUploading ? t("A processar...") : t("Enviar e analisar")}
            </button>
          </div>

          <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
            {t("Formatos aceites: PDF, JPG, PNG, WEBP, TIFF · Máximo 10 MB")}
          </p>
        </div>
      )}

      {/* ── STEP: REVIEW — Confirm extracted data ── */}
      {step === "review" && uploadResult && (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: 17 }}>{t("Confirmar dados extraídos")}</h2>
          <p style={{ margin: "0 0 18px 0", fontSize: 13, color: "#555" }}>
            {t("Verifica se os dados abaixo estão corretos antes de confirmar.")}
          </p>

          {(() => {
            const label = uploadResult.confidence_label;
            const color = CONFIDENCE_COLORS[label] || "#555";
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#444" }}>{t("Confiança:")}</span>
                <span style={{ fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: `${color}22`, color }}>
                  {label.charAt(0).toUpperCase() + label.slice(1)} ({uploadResult.invoice.confidence}%)
                </span>
              </div>
            );
          })()}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: t("Nome detetado"), value: uploadResult.invoice.name_detected || "–" },
              { label: t("Entidade"), value: uploadResult.invoice.entity || "–" },
              { label: t("Consumo"), value: uploadResult.invoice.kwh !== null ? `${uploadResult.invoice.kwh} kWh` : "–" },
              {
                label: t("Período"),
                value: uploadResult.invoice.period_start
                  ? `${formatDate(uploadResult.invoice.period_start)} → ${formatDate(uploadResult.invoice.period_end)}`
                  : "–",
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {uploadError && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", marginBottom: 14, fontSize: 14 }}>
              {uploadError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              style={{
                padding: "12px 24px", borderRadius: 8, border: "none",
                backgroundColor: isConfirming ? "#94a3b8" : "#22c55e",
                color: "white", fontWeight: 600, cursor: isConfirming ? "not-allowed" : "pointer",
              }}
            >
              {isConfirming ? t("A confirmar...") : t("Confirmar dados")}
            </button>
            <button
              onClick={() => { setStep("idle"); setUploadResult(null); setUploadError(null); }}
              style={{
                padding: "12px 24px", borderRadius: 8, border: "1px solid #e2e8f0",
                backgroundColor: "#fff", color: "#374151", fontWeight: 500, cursor: "pointer",
              }}
            >
              {t("Cancelar")}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: SUCCESS ── */}
      {step === "success" && confirmResult && (
        <div style={{ ...cardStyle, borderLeft: "4px solid #22c55e" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: 17, color: "#16a34a" }}>{t("Fatura confirmada!")}</h2>

          {confirmResult.overlap_warning && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fef3c7", color: "#92400e", fontSize: 13, marginBottom: 12 }}>
              {confirmResult.overlap_warning}
            </div>
          )}

          {confirmResult.missions_completed.length > 0 ? (
            <div>
              <p style={{ margin: "0 0 10px 0", fontWeight: 600 }}>
                {t("Missões completadas:")}
              </p>
              {confirmResult.missions_completed.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#f0fff4", marginBottom: 6 }}>
                  <span>{m.title}</span>
                  <span style={{ fontWeight: 700, color: "#16a34a" }}>+{m.points} pts</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontWeight: 700, fontSize: 16, color: "#16a34a" }}>
                +{confirmResult.points_awarded} {t("pontos no total")}
              </div>
            </div>
          ) : (
            <p style={{ color: "#555", margin: "0 0 4px 0" }}>
              {t("Nenhuma missão de fatura ativa para este consumo. Continua a reduzir o consumo!")}
            </p>
          )}

          <button
            onClick={() => { setStep("idle"); setConfirmResult(null); setUploadResult(null); }}
            style={{
              marginTop: 16, padding: "10px 20px", borderRadius: 8, border: "none",
              backgroundColor: "#22c55e", color: "white", fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("Enviar outra fatura")}
          </button>
        </div>
      )}

      {/* ── Aliases (family names) ── */}
      <div style={cardStyle}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setShowAliases(!showAliases)}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>{t("Titulares associados")}</h2>
          <span style={{ color: "#64748b" }}>{showAliases ? "▲" : "▼"}</span>
        </div>

        {showAliases && (
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "#555" }}>
              {t("Adiciona nomes de familiares cujas faturas também queres submeter (ex: contas em nome do cônjuge ou pais).")}
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder={t("Nome completo")}
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
              />
              <button
                onClick={handleAddAlias}
                disabled={addingAlias || !newAlias.trim()}
                style={{
                  padding: "8px 16px", borderRadius: 6, border: "none",
                  backgroundColor: newAlias.trim() ? "#22c55e" : "#94a3b8",
                  color: "white", fontWeight: 600, cursor: newAlias.trim() ? "pointer" : "not-allowed",
                }}
              >
                {t("Adicionar")}
              </button>
            </div>

            {aliases.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>{t("Nenhum titular associado.")}</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {aliases.map((a) => (
                  <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "#f1f5f9", border: "1px solid #e2e8f0", fontSize: 13 }}>
                    {a.name}
                    <button
                      onClick={() => handleRemoveAlias(a.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, fontSize: 15, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Invoice history ── */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 17 }}>{t("Histórico de faturas")}</h2>

        {loadingList ? (
          <p style={{ color: "#94a3b8" }}>{t("A carregar...")}</p>
        ) : invoices.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>{t("Ainda não enviaste nenhuma fatura.")}</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {invoices.map((inv) => (
              <div key={inv.id} style={{ padding: 14, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {inv.entity || "–"} · {inv.kwh !== null ? `${inv.kwh} kWh` : "–"} · {formatDate(inv.period_start)}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {inv.name_detected ? `${t("Nome:")} ${inv.name_detected} · ` : ""}
                      {t("Enviada:")} {formatDate(inv.created_at)}
                      {inv.confirmed_at ? ` · ${t("Confirmada:")} ${formatDate(inv.confirmed_at)}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {statusBadge(inv.status)}
                    {inv.status === "pending_confirmation" && (
                      <button
                        onClick={() => handleReject(inv.id)}
                        style={{ padding: "2px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer" }}
                      >
                        {t("Remover")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
