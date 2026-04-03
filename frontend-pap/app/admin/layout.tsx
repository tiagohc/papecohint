// app/admin/layout.tsx
"use client";

import React from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSidebar />
      <div style={{ marginLeft: 260, minHeight: "100vh", backgroundColor: "linear-gradient(135deg, #f0fdf4 0%, #f4f8f5 100%)" }}>
        <AdminHeader />
        <main style={{ padding: 30 }}>
          {children}
        </main>
      </div>
    </>
  );
}
