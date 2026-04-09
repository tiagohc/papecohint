"use client";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminDashboard() {
  const { t } = useLanguage();

  return (
    <>
      <h1>{t("Painel de Administração")}</h1>
      <p>{t("Gestão global do sistema.")}</p>
    </>
  );
}
