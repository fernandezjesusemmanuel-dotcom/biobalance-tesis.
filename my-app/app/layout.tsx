import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// IMPORTAMOS LOS COMPONENTES FLOTANTES
import AIChat from "@/components/dashboard/AIChat";       
import BottomNav from "@/components/dashboard/BottomNav"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BioBalance",
  description: "Gestión de Carga Alostática",
  manifest: "/manifest.json", 
  themeColor: "#0D9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-[#FAFAF9] pb-24`}>
        
        {/* CONTENIDO PRINCIPAL */}
        <main className="relative z-0">
          {children}
        </main>

        {/* COMPONENTES GLOBALES (Siempre visibles) */}
        <AIChat />
        <BottomNav />

      </body>
    </html>
  );
}