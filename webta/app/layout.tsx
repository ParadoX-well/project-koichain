import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import WalletConflictModal from "@/components/WalletConflictModal";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KoiChain ID - Sertifikasi Digital",
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
        <WalletProvider>
          <Toaster position="top-center" />
          {/* Modal konflik wallet — muncul otomatis dari WalletContext */}
          <WalletConflictModal />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}