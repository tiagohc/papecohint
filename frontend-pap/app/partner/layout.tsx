"use client";

import React from "react";
import PartnerSidebar from "./components/PartnerSidebar";
import PartnerHeader from "./components/PartnerHeader";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PartnerSidebar />
      <div
        className="partner-content-wrapper"
        style={{
          minHeight: "100vh",
        }}
      >
        <PartnerHeader />
        <main style={{ padding: 30 }}>{children}</main>
      </div>
    </>
  );
}
