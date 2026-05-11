import "./globals.css";
import { LanguageProvider } from "./components/LanguageProvider";
import ThemeProvider from "./components/ThemeProvider";
import SplashScreen from "./components/SplashScreen";

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
            <SplashScreen />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}