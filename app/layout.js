import "bootstrap/dist/css/bootstrap.min.css";
import { DM_Sans } from "next/font/google";
import AppFrame from "./components/AppFrame";
import "./globals.css";

const fonte = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "ImobGest",
  description: "Sistema de administração de imóveis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body className={fonte.className}>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
