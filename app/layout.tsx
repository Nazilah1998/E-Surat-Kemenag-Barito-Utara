import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { FramerProvider } from "@/components/providers/framer-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://surat.kemenag-baritoutara.com"),
  title: {
    default: "E-Surat Mandau | Kemenag Barito Utara",
    template: "%s | E-Surat Mandau",
  },
  description:
    "Portal resmi Sistem Informasi Manajemen Persuratan Elektronik (E-Surat) Kementerian Agama (Kemenag) Kabupaten Barito Utara. Masuk ke panel admin untuk mengelola administrasi persuratan.",
  keywords: [
    "e-surat kemenag",
    "surat kemenag barito utara",
    "kementerian agama barito utara",
    "persuratan elektronik kemenag",
    "aplikasi surat kemenag",
    "e-surat mandau kemenag",
    "sistem surat kemenag",
  ],
  authors: [{ name: "Kemenag Barito Utara" }],
  creator: "Kemenag Barito Utara",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://surat.kemenag-baritoutara.com",
    title: "E-Surat Mandau | Kemenag Barito Utara",
    description:
      "Portal resmi Sistem Informasi Manajemen Persuratan Elektronik Kementerian Agama Kabupaten Barito Utara.",
    siteName: "E-Surat Mandau Kemenag Barito Utara",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/kemenag.svg",
    shortcut: "/kemenag.svg",
    apple: "/kemenag.svg",
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
      suppressHydrationWarning
      className={`h-full antialiased ${plusJakartaSans.variable}`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FramerProvider>{children}</FramerProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
