import type { Metadata } from "next";
import "../styles/globals.css";
import { ToastProvider } from "@/components/wrappers/toast";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export const metadata: Metadata = {
  title: "Personal PM Tool",
  description: "Your personal project management tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
        <ToastProvider />
      </body>
    </html>
  );
}
