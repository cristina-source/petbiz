import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petbiz.pt";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "PetBiz — Sistema Operacional para Negócios Pet",
    template: "%s · PetBiz",
  },
  description:
    "Plataforma all-in-one para gerir o teu negócio pet: clientes, agenda, financeiro e muito mais. Do pet shop à clínica veterinária.",
  keywords: [
    "pet shop software",
    "gestão veterinária",
    "software grooming",
    "agenda pet",
    "gestão negócio pet",
    "PetBiz",
  ],
  authors: [{ name: "PetBiz" }],
  creator: "PetBiz",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: BASE_URL,
    siteName: "PetBiz",
    title: "PetBiz — Sistema Operacional para Negócios Pet",
    description:
      "Plataforma all-in-one para gerir o teu negócio pet: clientes, agenda, financeiro e muito mais.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PetBiz — Sistema Operacional para Negócios Pet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PetBiz — Sistema Operacional para Negócios Pet",
    description:
      "Plataforma all-in-one para gerir o teu negócio pet: clientes, agenda, financeiro e muito mais.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d4ed8" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
