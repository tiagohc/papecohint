import type { CSSProperties } from "react";

export const adminFormCardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #dbe3ef",
  borderRadius: 14,
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
  padding: 20,
};

export const adminFormGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

export const adminFormRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

export const adminInputStyle: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
};

export const adminTextareaStyle: CSSProperties = {
  ...adminInputStyle,
  minHeight: 90,
  resize: "vertical",
  fontFamily: "inherit",
};

export const adminSelectStyle: CSSProperties = {
  ...adminInputStyle,
};

export const adminErrorTextStyle: CSSProperties = {
  margin: 0,
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 600,
};

export const adminModalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(2, 6, 23, 0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50,
};

export const adminModalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: "#ffffff",
  border: "1px solid #dbe3ef",
  borderRadius: 14,
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
  padding: 20,
  display: "grid",
  gap: 10,
};
