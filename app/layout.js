import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
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
      <body className={fonte.className}>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
