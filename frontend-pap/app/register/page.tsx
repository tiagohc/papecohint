"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        return;
      }

      setSuccess("Conta criada com sucesso!");
      setTimeout(() => router.push("/"), 1500); // volta para login
    } catch {
      setError("Erro ao conectar com o servidor");
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
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 12,
          width: 380,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>
          Criar Conta EcoHint
        </h2>

        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 16 }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Criar Conta
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: 10 }}>{success}</p>}

        <p style={{ marginTop: 15, textAlign: "center" }}>
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
