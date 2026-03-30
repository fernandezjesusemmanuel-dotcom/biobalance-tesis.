import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// IMPORTAMOS EL MANEJADOR DE VISIBILIDAD (Componente de cliente)
import NavigationHandler from "@/components/layout/NavigationHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BioBalance",
  description: "Gestión de Carga Alostática y Bienestar Universitario",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BioBalance",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-[#FAFAF9]`}>
        
        {/* CONTENIDO PRINCIPAL */}
        <main className="relative z-0">
          {children}
        </main>

        {/* MANEJADOR DE NAVEGACIÓN CONDICIONAL */}
        <NavigationHandler />

      </body>
    </html>
  );
}