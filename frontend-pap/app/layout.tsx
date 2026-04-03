import "./globals.css";
import { LanguageProvider } from "./components/LanguageProvider";

export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#4CAF50",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) 
{
  return (
    <html lang="pt">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}