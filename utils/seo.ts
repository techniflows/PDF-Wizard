import type { Metadata, Viewport } from 'next';
import { DEFAULT_LANGUAGE, FEATURE_KEYS, LANGUAGES, LOCALES, getTranslations, type Language } from './i18n';

export const SITE_URL = 'https://pdfwizard.dev';

const OG_IMAGE_SIZE = { width: 1200, height: 630 };
const PUBLISHER = { '@type': 'Organization', name: 'techniflows', url: 'https://www.techniflows.com' };

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function languageAlternates(toUrl: (path: string) => string = (path) => path): Record<string, string> {
  return {
    ...Object.fromEntries(LANGUAGES.map((lang) => [LOCALES[lang].htmlLang, toUrl(LOCALES[lang].path)])),
    'x-default': toUrl(LOCALES[DEFAULT_LANGUAGE].path),
  };
}

export const siteViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export function buildMetadata(lang: Language): Metadata {
  const t = getTranslations(lang);
  const locale = LOCALES[lang];
  const { title, description } = t.meta;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: t.brand,
    authors: [{ name: PUBLISHER.name, url: PUBLISHER.url }],
    creator: PUBLISHER.name,
    publisher: PUBLISHER.name,
    alternates: {
      canonical: locale.path,
      languages: languageAlternates(),
    },
    openGraph: {
      type: 'website',
      url: locale.path,
      siteName: t.brand,
      title,
      description,
      locale: locale.ogLocale,
      alternateLocale: LANGUAGES.filter((other) => other !== lang).map((other) => LOCALES[other].ogLocale),
      images: [{ url: locale.ogImage, ...OG_IMAGE_SIZE, alt: t.heading }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: locale.ogImage, alt: t.heading }],
    },
    manifest: locale.manifest,
    icons: {
      icon: [
        { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/icon-152x152.png', sizes: '152x152' },
        { url: '/icon-192x192.png', sizes: '192x192' },
      ],
    },
    appleWebApp: {
      capable: true,
      title: t.brand,
      statusBarStyle: 'default',
    },
    formatDetection: { telephone: false },
  };
}

export function buildJsonLd(lang: Language) {
  const t = getTranslations(lang);
  const locale = LOCALES[lang];

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t.brand,
    url: absoluteUrl(locale.path),
    description: t.meta.description,
    inLanguage: locale.htmlLang,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: FEATURE_KEYS.map((key) => t.features[key].title),
    publisher: PUBLISHER,
  };
}
