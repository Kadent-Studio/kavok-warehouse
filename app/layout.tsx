import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kavok Warehouse",
    template: "%s · Kavok Warehouse",
  },
  description:
    "Sistema de control de almacén aeronáutico: catálogo de partes, stock, despachos y trazabilidad de movimientos.",
  applicationName: "Kavok Warehouse",
  authors: [{ name: "Kavok" }],
  generator: "Next.js",
  keywords: [
    "almacén aeronáutico",
    "control de inventario",
    "partes de aeronaves",
    "trazabilidad",
    "despachos",
  ],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Kavok Warehouse",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  // Sistema interno privado: no debe ser indexado por buscadores.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: "website",
    siteName: "Kavok Warehouse",
    title: "Kavok Warehouse",
    description: "Sistema de control de almacén aeronáutico",
    locale: "es_VE",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5254CE" },
    { media: "(prefers-color-scheme: dark)", color: "#2b2926" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
