import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { LOCALES, type Language } from '@/utils/i18n';
import { buildJsonLd } from '@/utils/seo';
import { LanguageProvider } from './LanguageProvider';
import ServiceWorkerRegistrar from './ServiceWorkerRegistrar';
import '@/app/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function RootShell({ lang, children }: { lang: Language; children: React.ReactNode }) {
  const jsonLd = JSON.stringify(buildJsonLd(lang)).replace(/</g, '\\u003c');

  return (
    <html lang={LOCALES[lang].htmlLang} className={geistSans.variable}>
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <LanguageProvider lang={lang}>{children}</LanguageProvider>
        <Analytics />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
