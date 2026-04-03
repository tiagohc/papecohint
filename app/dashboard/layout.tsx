"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div style={{ marginLeft: 260, minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #f4f8f5 100%)" }}>
        <Header />
        <main style={{ padding: 30, flex: 1 }}>
          {children}
        </main>
      </div>
    </>
  );
}
