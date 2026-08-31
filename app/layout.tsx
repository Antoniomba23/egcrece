import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EGCrece | Plataforma de Microinversión y Ahorro en Guinea Ecuatorial",
  description: "Plataforma fintech para ahorro programado e inversión en proyectos locales en Franco CFA (XAF) con Supabase y seguridad bancaria.",
  keywords: ["Guinea Ecuatorial", "Microinversión", "Ahorro", "FCFA", "XAF", "Fintech", "Mobile Money"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased w-full max-w-full overflow-x-hidden`}>
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
