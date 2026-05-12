
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
      <div className="admin-content-wrapper" style={{ minHeight: "100vh" }}>
        <AdminHeader />
        <main style={{ padding: 30 }}>
          {children}
        </main>
      </div>
    </>
  );
}
