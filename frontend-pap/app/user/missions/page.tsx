"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
import { fixEncoding } from "@/lib/fixEncoding";
import { useRouter } from "next/navigation";

type Mission = {
  id: number;
  title: string;
  description: string;
  type: "daily" | "monthly";
  access?: "free" | "premium";
  verification_type?: "photo" | "transport_ticket" | "invoice_kwh_below";
  target_kwh?: number | null;
  points: number;
  created_at?: string;
  expires_at?: string;
  image_url?: string;
  isCompleted: number;
  is_locked?: boolean;
  lock_reason?: string | null;
};

type TicketPreview = {
  dados_extraidos: {
    empresa?: string;
    origem?: string;
    destino?: string;
    data?: string;
    hora?: string;
    preco?: number | string;
    numero_bilhete?: string;
    passageiro?: string;
  };
  erros: string[];
  aviso_ia: { nivel_risco: string; observacoes: string[] } | null;
  pode_confirmar: boolean;
};

type InvoiceUploadResult = {
  invoice: {
    id: number;
    name_detected: string | null;
    kwh: number | null;
    period_start: string | null;
    period_end: string | null;
    entity: string | null;
    confidence: number;
    status: string;
  };
  confidence_label: "alto" | "médio" | "baixo";
};

export default function MissionsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [history, setHistory] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "history">("daily");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Photo flow
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ticket flow (2-step: preview → confirm)
  const ticketInputRef = useRef<HTMLInputElement>(null);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketPreview, setTicketPreview] = useState<TicketPreview | null>(null);
  const [previewingMissionId, setPreviewingMissionId] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Invoice flow (2-step: upload → confirm)
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<InvoiceUploadResult | null>(null);
  const [previewingInvoiceMissionId, setPreviewingInvoiceMissionId] = useState<number | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [confirmingInvoice, setConfirmingInvoice] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedPoints = typeof window !== "undefined" ? localStorage.getItem("ecohint-points") : null;
    if (storedPoints) setUserPoints(Number(storedPoints));

    if (!token) return;

    Promise.all([
      fetch(`/api/user/missions?lang=${language}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/user/missions/history?lang=${language}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([active, hist, me]) => {
      const missionsData = Array.isArray(active) ? active : [];
      setMissions(missionsData);
      setHistory(Array.isArray(hist) ? hist : []);
      const completed = missionsData.filter((m) => m.isCompleted === 1).length;
      setMissionsCompleted(completed);
      if (typeof window !== "undefined") {
        localStorage.setItem("ecohint-missions-completed", String(completed));
        if (me && typeof me.eco_points === "number") {
          setUserPoints(me.eco_points);
          localStorage.setItem("ecohint-points", String(me.eco_points));
        }
      }
      setLoading(false);
    }).catch(console.error);
  }, [token, language]);

  // â”€â”€ Photo flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFileSelect = (missionId: number) => {
    setSelectedMissionId(missionId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMissionId) return;
    setSubmitting(selectedMissionId);

    const reader = new FileReader();
    reader.onload = async () => {
      const photoUrl = reader.result as string;
      try {
        const res = await fetch(`/api/user/missions/${selectedMissionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ photoUrl }),
        });

        if (res.ok) {
          const payload = await res.json();
          const gainedPoints = Number(payload?.points_awarded || 0);
          if (gainedPoints > 0) {
            setUserPoints((prev) => {
              const next = prev + gainedPoints;
              if (typeof window !== "undefined") localStorage.setItem("ecohint-points", String(next));
              return next;
            });
          }
          alert(`${t("Missão completada!")} (+${gainedPoints} ${t("pontos")})`);
          await refreshMissions();
          setActiveTab("history");
        } else {
          const payload = await res.json().catch(() => ({}));
          alert(payload?.error || t("Erro ao submeter missão"));
        }
      } catch {
        alert(t("Erro ao submeter missão"));
      } finally {
        setSubmitting(null);
        setSelectedMissionId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  // â”€â”€ Ticket flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleTicketSelect = (missionId: number) => {
    setPreviewingMissionId(missionId);
    ticketInputRef.current?.click();
  };

  const handleTicketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !previewingMissionId) return;

    setTicketFile(file);
    setPreviewing(true);

    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await fetch(`/api/user/missions/${previewingMissionId}/preview-ticket`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(payload?.error || t("Não foi possível ler o bilhete."));
        setTicketFile(null);
        setPreviewingMissionId(null);
        if (ticketInputRef.current) ticketInputRef.current.value = "";
        return;
      }

      setTicketPreview(payload as TicketPreview);
    } catch {
      alert(t("Erro ao analisar o bilhete."));
      setTicketFile(null);
      setPreviewingMissionId(null);
      if (ticketInputRef.current) ticketInputRef.current.value = "";
    } finally {
      setPreviewing(false);
    }
  };

  const handleTicketConfirm = async () => {
    if (!ticketFile || !previewingMissionId) return;
    setConfirming(true);

    const formData = new FormData();
    formData.append("document", ticketFile);

    try {
      const res = await fetch(`/api/user/missions/${previewingMissionId}/complete-with-ticket`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        const gainedPoints = Number(payload?.points_awarded || 0);
        if (gainedPoints > 0) {
          setUserPoints((prev) => {
            const next = prev + gainedPoints;
            if (typeof window !== "undefined") localStorage.setItem("ecohint-points", String(next));
            return next;
          });
        }
        alert(`${t("Missão completada!")} (+${gainedPoints} ${t("pontos")})`);
        await refreshMissions();
        setActiveTab("history");
      } else {
        const details = payload?.detalhes?.join("\n") || "";
        alert((payload?.error || t("Bilhete inválido.")) + (details ? "\n\n" + details : ""));
      }
    } catch {
      alert(t("Erro ao submeter bilhete."));
    } finally {
      setConfirming(false);
      setTicketFile(null);
      setTicketPreview(null);
      setPreviewingMissionId(null);
      if (ticketInputRef.current) ticketInputRef.current.value = "";
    }
  };

  const handleTicketCancel = () => {
    setTicketFile(null);
    setTicketPreview(null);
    setPreviewingMissionId(null);
    if (ticketInputRef.current) ticketInputRef.current.value = "";
  };

  // ── Invoice flow ──────────────────────────────────────────────────────────
  const handleInvoiceSelect = (missionId: number) => {
    setPreviewingInvoiceMissionId(missionId);
    invoiceInputRef.current?.click();
  };

  const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !previewingInvoiceMissionId) return;

    setInvoiceFile(file);
    setUploadingInvoice(true);

    const formData = new FormData();
    formData.append("invoice", file);

    try {
      const res = await fetch("/api/user/energy-invoices/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = payload.details
          ? `${payload.error}: ${(payload.details as string[]).join("; ")}`
          : payload.error;
        alert(msg || t("Não foi possível ler a fatura."));
        setInvoiceFile(null);
        setPreviewingInvoiceMissionId(null);
        if (invoiceInputRef.current) invoiceInputRef.current.value = "";
        return;
      }

      setInvoicePreview(payload as InvoiceUploadResult);
    } catch {
      alert(t("Erro ao analisar a fatura."));
      setInvoiceFile(null);
      setPreviewingInvoiceMissionId(null);
      if (invoiceInputRef.current) invoiceInputRef.current.value = "";
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleInvoiceConfirm = async () => {
    if (!invoicePreview || !previewingInvoiceMissionId) return;
    setConfirmingInvoice(true);

    try {
      const res = await fetch(`/api/user/energy-invoices/${invoicePreview.invoice.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(payload?.error || t("Erro ao confirmar fatura."));
        return;
      }

      const gainedPoints = Number(payload?.points_awarded || 0);
      const completedMissions: { id: number; title: string; points: number }[] = payload?.missions_completed || [];
      const thisMissionCompleted = completedMissions.some((m) => m.id === previewingInvoiceMissionId);

      if (thisMissionCompleted || gainedPoints > 0) {
        if (gainedPoints > 0) {
          setUserPoints((prev) => {
            const next = prev + gainedPoints;
            if (typeof window !== "undefined") localStorage.setItem("ecohint-points", String(next));
            return next;
          });
        }
        alert(`${t("Missão completada!")} (+${gainedPoints} ${t("pontos")})`);
        await refreshMissions();
        setActiveTab("history");
      } else {
        // Fatura confirmada mas missão não completada (consumo acima do limite ou período fora da janela)
        const kwh = invoicePreview.invoice.kwh;
        const periodStr = invoicePreview.invoice.period_start
          ? ` (período: ${new Date(invoicePreview.invoice.period_start).toLocaleDateString("pt-PT")} – ${invoicePreview.invoice.period_end ? new Date(invoicePreview.invoice.period_end).toLocaleDateString("pt-PT") : "?"})`
          : "";
        alert(
          t("Fatura registada") + periodStr + ", " +
          t("mas não cumpre os requisitos da missão.") + "\n\n" +
          (kwh !== null ? `Consumo: ${kwh} kWh\n` : "") +
          t("Verifica se a fatura é do período correto e se o consumo está dentro do limite.")
        );
        await refreshMissions();
      }
    } catch {
      alert(t("Erro ao submeter fatura."));
    } finally {
      setConfirmingInvoice(false);
      setInvoiceFile(null);
      setInvoicePreview(null);
      setPreviewingInvoiceMissionId(null);
      if (invoiceInputRef.current) invoiceInputRef.current.value = "";
    }
  };

  const handleInvoiceCancel = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    setPreviewingInvoiceMissionId(null);
    if (invoiceInputRef.current) invoiceInputRef.current.value = "";
  };

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const refreshMissions = async () => {
    if (!token) return;
    const [active, hist, me] = await Promise.all([
      fetch(`/api/user/missions?lang=${language}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch(`/api/user/missions/history?lang=${language}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]);
    const missionsData = Array.isArray(active) ? active : [];
    setMissions(missionsData);
    setHistory(Array.isArray(hist) ? hist : []);
    const completed = missionsData.filter((m: Mission) => m.isCompleted === 1).length;
    setMissionsCompleted(completed);
    if (typeof window !== "undefined") {
      localStorage.setItem("ecohint-missions-completed", String(completed));
      if (me && typeof me.eco_points === "number") {
        setUserPoints(me.eco_points);
        localStorage.setItem("ecohint-points", String(me.eco_points));
      }
    }
  };

  if (loading) return <p>{t("Carregando missões...")}</p>;

  const filteredMissions = activeTab !== "history" ? missions.filter(m => m.type === activeTab) : [];

  const missionCardStyle = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "var(--bg-card, #fff)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 15,
    border: "1px solid var(--border, #e5e7eb)",
  };

  const tabButtonStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    backgroundColor: isActive ? "#22c55e" : "var(--bg-secondary, #f3f4f6)",
    color: isActive ? "#fff" : "var(--text-secondary, #666)",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: isActive ? "bold" : "normal",
    marginRight: 10,
  });

  const actionButtonStyle = (disabled?: boolean, color = "#22c55e") => ({
    padding: "8px 16px",
    backgroundColor: disabled ? "#d1d5db" : color,
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 14,
    marginRight: 8,
  });

  const getAccessBadge = (access?: Mission["access"]) => {
    if (access === "premium") return { label: t("Premium"), color: "#7c3aed", bgColor: "#ede9fe" };
    return null;
  };

  const getStatusBadge = (mission: Mission) => {
    if (!mission.isCompleted) return { text: t("Não Completada"), color: "#ef4444", bgColor: "#fee2e2" };
    return { text: t("Concluída"), color: "#15803d", bgColor: "#dcfce7" };
  };

  const getRemainingSeconds = (mission: Mission) => {
    let expiry: Date | null = null;
    if (mission.expires_at) {
      const parsed = new Date(mission.expires_at);
      if (!Number.isNaN(parsed.getTime())) expiry = parsed;
    }
    if (!expiry && mission.created_at) {
      const createdAt = new Date(mission.created_at);
      if (!Number.isNaN(createdAt.getTime())) {
        const fallback = new Date(createdAt);
        if (mission.type === "daily") fallback.setDate(fallback.getDate() + 1);
        else if (mission.type === "monthly") fallback.setMonth(fallback.getMonth() + 1);
        expiry = fallback;
      }
    }
    if (!expiry) return null;
    return Math.max(0, Math.floor((expiry.getTime() - now) / 1000));
  };

  const formatRemaining = (seconds: number | null) => {
    if (seconds === null) return "-";
    if (seconds <= 0) return t("Expirada");
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const availableMissions = filteredMissions.filter((mission) => {
    if (mission.isCompleted === 1) return false;
    const remaining = getRemainingSeconds(mission);
    return remaining === null || remaining > 0;
  });

  const isTicketMission = (m: Mission) => m.verification_type === "transport_ticket";
  const isInvoiceMission = (m: Mission) => m.verification_type === "invoice_kwh_below";
  const isFirstInvoiceMission = (m: Mission) => m.verification_type === "first_invoice";

  // Missão de onboarding ainda por completar
  const onboardingPending = missions.find(m => isFirstInvoiceMission(m) && m.isCompleted === 0);

  const getMissionDescription = (mission: Mission) => {
    if (mission.verification_type === "first_invoice") {
      return language === "en"
        ? "Upload and confirm your first energy invoice to unlock saving missions!"
        : "Envia e confirma a tua primeira fatura de energia para desbloquear as missões de poupança!";
    }
    if (mission.verification_type === "invoice_kwh_below" && mission.target_kwh) {
      return language === "en"
        ? `Submit an energy invoice with consumption below ${mission.target_kwh} kWh.`
        : `Submete uma fatura de energia com consumo abaixo de ${mission.target_kwh} kWh.`;
    }
    return fixEncoding(mission.description);
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <h1>{t("Missões")}</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        {t("Complete missões e ganhe pontos EcoHint!")}
      </p>

      {/* Banner de onboarding — só aparece se a missão de primeira fatura ainda não foi completada */}
      {onboardingPending && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          backgroundColor: "#fef3c7", border: "1.5px solid #f59e0b",
          borderRadius: 12, padding: "16px 20px", marginBottom: 24,
        }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#92400e", fontSize: 15, marginBottom: 2 }}>
              {language === "en" ? "Start here: Submit your first invoice" : "Comece aqui: Submete a tua primeira fatura"}
            </div>
            <div style={{ fontSize: 13, color: "#78350f" }}>
              {language === "en"
                ? "Submit your first energy invoice to unlock the monthly saving missions."
                : "Envia a tua primeira fatura de energia para desbloquear as missões mensais de poupança."}
            </div>
          </div>
          <button
            onClick={() => router.push("/user/faturas")}
            style={{
              padding: "9px 18px", borderRadius: 8, border: "none",
              backgroundColor: "#f59e0b", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {language === "en" ? "Go to Invoices" : "Ir para Faturas"}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: 30 }}>
        <button style={tabButtonStyle(activeTab === "daily")} onClick={() => setActiveTab("daily")}>
          {t("Missões Diárias")}
        </button>
        <button style={tabButtonStyle(activeTab === "monthly")} onClick={() => setActiveTab("monthly")}>
          {t("Missões Mensais")}
        </button>        <button style={tabButtonStyle(activeTab === "history")} onClick={() => setActiveTab("history")}>
          {t("Histórico")} {history.length > 0 ? `(${history.length})` : ""}
        </button>      </div>

      {/* Missions List */}
      {activeTab !== "history" && (
      <div>
        {availableMissions.length === 0 ? (
          <div style={missionCardStyle}>
            <p style={{ textAlign: "center", color: "#999" }}>
              {t("Nenhuma missão disponível neste momento")}
            </p>
          </div>
        ) : (
          availableMissions.map(mission => {
            const status = getStatusBadge(mission);
            const access = getAccessBadge(mission.access);
            const remaining = getRemainingSeconds(mission);
            const isTicket = isTicketMission(mission);
            const isInvoice = isInvoiceMission(mission);
            const isFirstInvoice = isFirstInvoiceMission(mission);
            const isThisSubmitting = submitting === mission.id
              || (previewing && previewingMissionId === mission.id)
              || (uploadingInvoice && previewingInvoiceMissionId === mission.id);
            // Força missões de energia a nunca ficarem locked
            const isLocked = mission.is_locked && !isInvoice;

            return (
              <div key={mission.id} style={{
                ...missionCardStyle,
                ...(isLocked ? { opacity: 0.7, backgroundColor: "var(--bg-secondary, #f9fafb)", border: "1px dashed var(--border, #d1d5db)" } : {}),
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 20 }}>{fixEncoding(mission.title)}</h3>
                      {isFirstInvoice && (
                        <span style={{
                          padding: "2px 8px",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}>
                          ⚡ {t("Onboarding")}
                        </span>
                      )}
                      {isTicket && (
                        <span style={{
                          padding: "2px 8px",
                          backgroundColor: "#dcfce7",
                          color: "#15803d",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}>
                          {t("Bilhete")}
                        </span>
                      )}
                      {isInvoice && (
                        <span style={{
                          padding: "2px 8px",
                          backgroundColor: "#fef9c3",
                          color: "#854d0e",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}>
                          {t("Fatura Energia")}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: 14 }}>
                      {getMissionDescription(mission)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#22c55e" }}>
                          +{mission.points} pts
                        </div>
                        {access && (
                          <div style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: "bold",
                            backgroundColor: access.bgColor,
                            color: access.color,
                          }}>
                            {access.label}
                          </div>
                        )}
                      </div>
                      <div style={{
                        padding: "5px 12px",
                        backgroundColor: status.bgColor,
                        color: status.color,
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}>
                        {status.text}
                      </div>
                      <div style={{
                        padding: "5px 12px",
                        backgroundColor: "#eef2ff",
                        color: "#3730a3",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}>
                        {t("Tempo restante")}: {formatRemaining(remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginLeft: 20 }}>
                    ) : isLocked ? (
                      <div style={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        border: "1px dashed #9ca3af",
                        maxWidth: 180,
                        textAlign: "center",
                      }}>
                        <span style={{ fontSize: 22 }}>🔒</span>
                        <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                          {mission.lock_reason || t("Indisponível de momento")}
                        </span>
                      </div>
                    ) : isInvoice ? (
                      <button
                        style={actionButtonStyle(isThisSubmitting, "#0f766e")}
                        onClick={() => handleInvoiceSelect(mission.id)}
                        disabled={isThisSubmitting}
                      >
                        {isThisSubmitting ? t("A analisar...") : t("Submeter Fatura")}
                      </button>
                    ) : isFirstInvoice ? (
                        <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                          {mission.lock_reason || t("Indisponível de momento")}
                        </span>
                      </div>
                    ) : isFirstInvoice ? (
                      <button
                        style={actionButtonStyle(false, "#f59e0b")}
                        onClick={() => router.push("/user/faturas")}
                      >
                        {language === "en" ? "Submit Invoice" : "Submeter Fatura"}
                      </button>
                    ) : !mission.isCompleted ? (
                      isTicket ? (
                        <button
                          style={actionButtonStyle(isThisSubmitting, "#0f766e")}
                          onClick={() => handleTicketSelect(mission.id)}
                          disabled={isThisSubmitting}
                        >
                          {previewing && previewingMissionId === mission.id
                            ? t("A analisar...")
                            : t("Submeter Bilhete")}
                        </button>
                      ) : isInvoice ? (
                        <button
                          style={actionButtonStyle(isThisSubmitting, "#d97706")}
                          onClick={() => handleInvoiceSelect(mission.id)}
                          disabled={isThisSubmitting}
                        >
                          {uploadingInvoice && previewingInvoiceMissionId === mission.id
                            ? t("A analisar...")
                            : t("Submeter Fatura")}
                        </button>
                      ) : (
                        <button
                          style={actionButtonStyle(isThisSubmitting)}
                          onClick={() => handleFileSelect(mission.id)}
                          disabled={isThisSubmitting}
                        >
                          {submitting === mission.id ? t("Enviando...") : t("Submeter Foto")}
                        </button>
                      )
                    ) : (
                      <button style={actionButtonStyle(true)} disabled>
                        {t("Concluída")}
                      </button>
                    )}
                  </div>
                </div>

                {mission.image_url && (
                  <img
                    src={mission.image_url}
                    alt={mission.title}
                    style={{ marginTop: 15, maxWidth: "200px", maxHeight: "150px", borderRadius: 5 }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div>
          {history.length === 0 ? (
            <div style={missionCardStyle}>
              <p style={{ textAlign: "center", color: "#999" }}>
                {t("Ainda não completaste nenhuma missão")}
              </p>
            </div>
          ) : (
            history.map(mission => {
              const completed = mission.isCompleted === 1;
              const expiresAt = mission.expires_at ? new Date(mission.expires_at) : null;
              return (
                <div key={mission.id} style={{
                  ...missionCardStyle,
                  opacity: 0.85,
                  borderLeft: `4px solid ${completed ? "#22c55e" : "#d1d5db"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 18, color: "var(--text-main, #374151)" }}>{fixEncoding(mission.title)}</h3>
                        <span style={{
                          padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                          backgroundColor: completed ? "#d1fae5" : "#f3f4f6",
                          color: completed ? "#065f46" : "#6b7280",
                        }}>
                          {completed ? t("Concluída") : t("Não completada")}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 8px 0", color: "#9ca3af", fontSize: 13 }}>
                        {getMissionDescription(mission)}
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#6b7280" }}>
                        <span>+{mission.points} pts</span>
                        <span>·</span>
                        <span>{mission.type === "daily" ? t("Diária") : t("Mensal")}</span>
                        {expiresAt && (
                          <>
                            <span>·</span>
                            <span>{t("Expirou em")} {expiresAt.toLocaleDateString("pt-PT")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
      <input
        ref={ticketInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
        style={{ display: "none" }}
        onChange={handleTicketFileChange}
      />
      <input
        ref={invoiceInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/tiff"
        style={{ display: "none" }}
        onChange={handleInvoiceFileChange}
      />

      {/* Ticket Confirmation Modal */}
      {ticketPreview && previewingMissionId && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 32,
            maxWidth: 480,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 20 }}>
              {t("Confirmar Bilhete")}
            </h2>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 20px 0" }}>
              {t("Verifica os dados detetados pela IA antes de confirmar.")}
            </p>

            {/* Extracted data */}
            <div style={{
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              border: "1px solid #e2e8f0",
            }}>
              {[
                [t("Empresa"), ticketPreview.dados_extraidos.empresa],
                [t("Data"), ticketPreview.dados_extraidos.data],
                [t("Hora"), ticketPreview.dados_extraidos.hora],
                [t("Origem"), ticketPreview.dados_extraidos.origem],
                [t("Destino"), ticketPreview.dados_extraidos.destino],
                [t("Preço"), ticketPreview.dados_extraidos.preco ? `€${ticketPreview.dados_extraidos.preco}` : undefined],
                [t("Nº Bilhete"), ticketPreview.dados_extraidos.numero_bilhete],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: "#64748b", minWidth: 110 }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value as string}</span>
                  </div>
                ))}
            </div>

            {/* Errors */}
            {ticketPreview.erros.length > 0 && (
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}>
                <p style={{ margin: "0 0 6px 0", color: "#dc2626", fontWeight: 600, fontSize: 13 }}>
                  {t("Problemas encontrados:")}
                </p>
                {ticketPreview.erros.map((err, i) => (
                  <p key={i} style={{ margin: "2px 0", color: "#dc2626", fontSize: 13 }}>• {err}</p>
                ))}
              </div>
            )}

            {/* AI warning */}
            {ticketPreview.aviso_ia && (
              <div style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}>
                <p style={{ margin: "0 0 4px 0", color: "#92400e", fontWeight: 600, fontSize: 13 }}>
                  {t("Aviso de verificação:")} {ticketPreview.aviso_ia.nivel_risco}
                </p>
                {ticketPreview.aviso_ia.observacoes?.map((obs, i) => (
                  <p key={i} style={{ margin: "2px 0", color: "#92400e", fontSize: 13 }}>• {obs}</p>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={handleTicketCancel}
                disabled={confirming}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: 6,
                  cursor: confirming ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                {t("Cancelar")}
              </button>
              <button
                onClick={handleTicketConfirm}
                disabled={!ticketPreview.pode_confirmar || confirming}
                style={{
                  padding: "10px 20px",
                  backgroundColor: !ticketPreview.pode_confirmar || confirming ? "#d1d5db" : "#1d4ed8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: !ticketPreview.pode_confirmar || confirming ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {confirming ? t("A confirmar...") : t("Confirmar Missão")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Confirmation Modal */}
      {invoicePreview && previewingInvoiceMissionId && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 32,
            maxWidth: 480,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 20 }}>
              {t("Confirmar Fatura de Energia")}
            </h2>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 20px 0" }}>
              {t("Verifica os dados extraídos da fatura antes de confirmar.")}
            </p>

            {/* Confiança */}
            {(() => {
              const COLORS: Record<string, string> = { alto: "#16a34a", médio: "#d97706", baixo: "#dc2626" };
              const label = invoicePreview.confidence_label;
              const color = COLORS[label] || "#555";
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "#444" }}>{t("Confiança:")}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: "2px 10px",
                    borderRadius: 999, background: `${color}22`, color,
                  }}>
                    {label.charAt(0).toUpperCase() + label.slice(1)} ({invoicePreview.invoice.confidence}%)
                  </span>
                </div>
              );
            })()}

            {/* Dados extraídos */}
            <div style={{
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              border: "1px solid #e2e8f0",
            }}>
              {[
                [t("Titular"), invoicePreview.invoice.name_detected],
                [t("Entidade"), invoicePreview.invoice.entity],
                [t("Consumo"), invoicePreview.invoice.kwh !== null ? `${invoicePreview.invoice.kwh} kWh` : null],
                [t("Período"), invoicePreview.invoice.period_start
                  ? `${new Date(invoicePreview.invoice.period_start).toLocaleDateString("pt-PT")} → ${invoicePreview.invoice.period_end ? new Date(invoicePreview.invoice.period_end).toLocaleDateString("pt-PT") : "–"}`
                  : null],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: "#64748b", minWidth: 100 }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value as string}</span>
                  </div>
                ))}
            </div>

            {/* Botões */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={handleInvoiceCancel}
                disabled={confirmingInvoice}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: 6,
                  cursor: confirmingInvoice ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}
              >
                {t("Cancelar")}
              </button>
              <button
                onClick={handleInvoiceConfirm}
                disabled={confirmingInvoice}
                style={{
                  padding: "10px 20px",
                  backgroundColor: confirmingInvoice ? "#d1d5db" : "#d97706",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: confirmingInvoice ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {confirmingInvoice ? t("A confirmar...") : t("Confirmar Fatura")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div style={{
        marginTop: 40,
        padding: 20,
        backgroundColor: "#f0fdf4",
        borderRadius: 8,
        borderLeft: "4px solid #22c55e",
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#15803d" }}>
          {t("Como Funciona")}
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#666" }}>
          <li>{t("Escolha uma missão e clique em Submeter Foto, Submeter Bilhete ou Submeter Fatura")}</li>
          <li>{t("Para missões de transporte, envia uma fotografia ou PDF do bilhete Mobiazores")}</li>
          <li>{t("Para missões de energia, envia a tua fatura de eletricidade (PDF ou imagem)")}</li>
          <li>{t("Confirma os dados detetados e a missão é completada automaticamente")}</li>
          <li>{t("Acumule pontos e troque por rewards!")}</li>
        </ol>
      </div>
    </div>
  );
}
