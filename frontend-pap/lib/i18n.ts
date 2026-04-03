// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {},
  });

// ⚡ Export para satisfazer TypeScript
export default i18n;