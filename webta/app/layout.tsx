import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext"; // Import Provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebKoi - Sertifikasi Digital",
  description: "Platform sertifikasi ikan koi berbasis blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Bungkus semuanya dengan WalletProvider */}
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}