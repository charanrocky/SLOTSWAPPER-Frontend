"use client";

import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { useEffect, useState } from "react";

function LayoutWithSocket({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render only after hydration to safely access user
  if (!mounted) return null;

  return (
    <SocketProvider user={user}>
      <Navbar />
      <Toaster position="top-right" richColors />
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </SocketProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <LayoutWithSocket>{children}</LayoutWithSocket>
        </AuthProvider>
      </body>
    </html>
  );
}
