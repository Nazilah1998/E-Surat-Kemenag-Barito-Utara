import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { FramerProvider } from "@/components/providers/framer-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "E-Surat | Kemenag Barito Utara",
  description: "Sistem Elektronik Persuratan Kemenag Barito Utara",
  icons: {
    icon: "/kemenag.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`h-full antialiased ${plusJakartaSans.variable}`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <FramerProvider>
          {children}
        </FramerProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
