import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { getSession } from "@/lib/auth";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Iberic Distributions",
  description: "Distribución B2B de productos ibéricos — Galvan",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
