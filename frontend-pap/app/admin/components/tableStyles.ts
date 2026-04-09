import type { CSSProperties } from "react";

export const adminTableContainerStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

export const adminTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 720,
};

export const adminTableHeadRowStyle: CSSProperties = {
  backgroundColor: "#edf3fb",
};

export const adminTableHeaderCellStyle: CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  borderBottom: "1px solid #dbe3ef",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 700,
};

export const adminTableCellStyle: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #e8eef6",
  color: "#1e293b",
  fontSize: 14,
};

export const adminTableRowStyle = (index: number): CSSProperties => ({
  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fbff",
});

export const adminActionPrimaryButtonStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #0f766e",
  borderRadius: 8,
  backgroundColor: "#0f766e",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

export const adminActionSecondaryButtonStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #334155",
  borderRadius: 8,
  backgroundColor: "#334155",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

export const adminActionDangerButtonStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #dc2626",
  borderRadius: 8,
  backgroundColor: "#dc2626",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

export const adminTopActionButtonStyle: CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #0f766e",
  borderRadius: 10,
  backgroundColor: "#0f766e",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export const adminTableInputStyle: CSSProperties = {
  width: 72,
  padding: "6px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 13,
  color: "#0f172a",
  backgroundColor: "#ffffff",
};
