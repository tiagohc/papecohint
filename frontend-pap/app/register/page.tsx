"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 12,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

export default function RegisterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Register user
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });

      if (res.status === 429) {
        // Render free tier sometimes throttles on wake-up — retry once after 3s
        setError("Servidor a acordar... a tentar novamente em 3 segundos.");
        await new Promise((r) => setTimeout(r, 3000));
        const retry = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, email, password }),
        });
        if (retry.status === 429) {
          setError("Servidor temporariamente sobrecarregado. Aguarda uns segundos e tenta novamente.");
          setLoading(false);
          return;
        }
        const retryData = await retry.json();
        if (!retry.ok) {
          setError(retryData.error || "Erro ao criar conta");
          setLoading(false);
          return;
        }
        const retryToken: string = retryData.token;
        localStorage.setItem("token", retryToken);
        router.push("/user");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      const token: string = data.token;

      // 2. Upload avatar if selected
      if (avatarFile && token) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        await fetch("/api/user/profile/avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }).catch(() => {/* avatar upload failure is non-fatal */});
      }

      // 3. Store token and redirect
      localStorage.setItem("token", token);
      router.push("/user");
    } catch {
      setError("Erro ao conectar com o servidor");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #a5d6a7 0%, #fff59d 100%)",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 12,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 24, color: "#1f2937" }}>
          Criar Conta EcoHint
        </h2>

        {/* Avatar picker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: "2px dashed #a3a3a3",
              backgroundColor: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 28 }}>📷</span>
            )}
          </div>
          <span
            onClick={() => fileRef.current?.click()}
            style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}
          >
            {avatarPreview ? "Alterar foto" : "Adicionar foto de perfil"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Nome completo</label>
        <input
          type="text"
          placeholder="O teu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Username</label>
        <input
          type="text"
          placeholder="@username"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
          required
          minLength={3}
          maxLength={30}
          style={inputStyle}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Email</label>
        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Password</label>
        <input
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: loading ? "#a3a3a3" : "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
          }}
        >
          {loading ? "A criar conta..." : "Criar Conta"}
        </button>

        {error && <p style={{ color: "#dc2626", marginTop: 10, fontSize: 13, textAlign: "center" }}>{error}</p>}

        <p style={{ marginTop: 18, textAlign: "center", fontSize: 14, color: "#6b7280" }}>
          Já tens conta?{" "}
          <span
            onClick={() => router.push("/")}
            style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "bold" }}
          >
            Entrar
          </span>
        </p>
      </form>
    </div>
  );
}
