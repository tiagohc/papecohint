"use client";

import { useEffect, useState } from "react";

type UploadedInvoice = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

export default function FaturasPage() {
  const [uploaded, setUploaded] = useState<UploadedInvoice[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ecohint-faturas") : null;
    if (stored) {
      try {
        setUploaded(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ecohint-faturas", JSON.stringify(uploaded));
  }, [uploaded]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Aqui você pode chamar a API para enviar o arquivo.
    // Por enquanto, estamos apenas armazenando localmente e simulando upload.

    const newInvoice: UploadedInvoice = {
      id: `${Date.now()}-${selectedFile.name}`,
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
    };

    // Simula um pequeno delay para UX
    await new Promise((resolve) => setTimeout(resolve, 400));

    setUploaded((prev) => [newInvoice, ...prev]);
    setSelectedFile(null);
    setIsUploading(false);
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: 20,
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 10 }}>Faturas</h1>
        <p style={{ margin: 0, color: "#666" }}>
          Faça upload da sua fatura para que a inteligência artificial possa analisar os dados e gerar insights.
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 15px 0" }}>Enviar documento</h2>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <label
            style={{
              padding: "16px 18px",
              borderRadius: 8,
              border: "2px dashed #22c55e",
              backgroundColor: "#f0fff4",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 500,
            }}
          >
            <span>Escolher arquivo</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>

          <button
            style={{
              padding: "14px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: selectedFile ? "#22c55e" : "#94a3b8",
              color: "white",
              cursor: selectedFile ? "pointer" : "not-allowed",
              fontWeight: 600,
              minWidth: 160,
            }}
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? "Enviando..." : "Enviar"}
          </button>
        </div>

        {selectedFile ? (
          <p style={{ marginTop: 14, color: "#333" }}>
            Arquivo selecionado: <strong>{selectedFile.name}</strong> ({formatSize(selectedFile.size)})
          </p>
        ) : (
          <p style={{ marginTop: 14, color: "#666" }}>
            Selecione um arquivo PDF, imagem JPG/PNG ou similar para enviar.
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 15px 0" }}>Faturas enviadas</h2>

        {uploaded.length === 0 ? (
          <p style={{ color: "#666" }}>Nenhuma fatura enviada ainda. Faça o upload para começar.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {uploaded.map((invoice) => (
              <div
                key={invoice.id}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{invoice.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      Enviado em {new Date(invoice.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#444" }}>{formatSize(invoice.size)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ marginTop: 18, color: "#666" }}>
          Em breve, a inteligência artificial analisará os dados da fatura e exibirá resultados automáticos.
        </p>
      </div>
    </div>
  );
}
