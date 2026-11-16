import type { MetadataRoute } from 'next';
import { LANGUAGES, LOCALES } from '@/utils/i18n';
import { absoluteUrl, languageAlternates } from '@/utils/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = languageAlternates(absoluteUrl);

  return LANGUAGES.map((lang) => ({
    url: absoluteUrl(LOCALES[lang].path),
    alternates: { languages },
  }));
}
