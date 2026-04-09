import "./globals.css";
import { LanguageProvider } from "./components/LanguageProvider";
import ThemeProvider from "./components/ThemeProvider";

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
    <html lang="pt" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}