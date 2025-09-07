import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerManager from '@/components/ServiceWorkerManager';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Wizard - Merge, Split & Convert PDFs",
  description: "Powerful PDF tool that works 100% on your device. Merge PDFs and images, split pages, rearrange, and convert - all privately without uploading to any server!",
  keywords: "PDF merge, PDF split, PDF convert, PDF tool, merge PDFs, split PDF pages, convert images to PDF, PDF editor, offline PDF tool",
  authors: [{ name: "techniflows", url: "https://www.techniflows.com" }],
  creator: "techniflows",
  publisher: "techniflows",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pdfwizard.dev",
    title: "PDF Wizard - Merge, Split & Convert PDFs",
    description: "Powerful PDF tool that works 100% on your device. Merge PDFs and images, split pages, rearrange, and convert - all privately without uploading to any server!",
    siteName: "PDF Wizard",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "PDF Wizard Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Wizard - Merge, Split & Convert PDFs",
    description: "Powerful PDF tool that works 100% on your device. Merge PDFs and images, split pages, rearrange, and convert - all privately without uploading to any server!",
    images: ["/icon-512x512.png"],
  },
  alternates: {
    canonical: "https://pdfwizard.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="PDF Wizard" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PDF Wizard" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="description" content="Powerful PDF tool that works 100% on your device. Merge PDFs and images, split pages, rearrange, and convert - all privately without uploading to any server!" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2563eb" />

        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PDF Wizard",
              "description": "Powerful PDF tool that works 100% on your device. Merge PDFs and images, split pages, rearrange, and convert - all privately without uploading to any server!",
              "url": "https://pdfwizard.dev",
              "applicationCategory": "Productivity",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "techniflows",
                "url": "https://www.techniflows.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "techniflows",
                "url": "https://www.techniflows.com"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerManager />
        {children}
      </body>
    </html>
  );
}
