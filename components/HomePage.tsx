import { FEATURE_KEYS, LOCALES, format, getTranslations, type Language } from '@/utils/i18n';
import { LanguageSwitch } from './LanguageSwitch';
import OfflineIndicator from './OfflineIndicator';
import PDFMerger from './PDFMerger';
import PWAInstall from './PWAInstall';
import { textLink } from './styles';

export default function HomePage({ lang }: { lang: Language }) {
  const t = getTranslations(lang);

  return (
    <div className="flex min-h-screen flex-col">
      <OfflineIndicator />

      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <a href={LOCALES[lang].path} className="inline-flex min-h-11 items-center font-semibold tracking-tight">
            {t.brand}
          </a>
          <LanguageSwitch current={lang} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.heading}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t.lead}</p>

        <div className="mt-8">
          <PDFMerger />
        </div>

        <section aria-labelledby="features-title" className="mt-16">
          <h2 id="features-title" className="text-lg font-semibold tracking-tight">
            {t.featuresTitle}
          </h2>
          <dl className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {FEATURE_KEYS.map((key) => (
              <div key={key} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium">{t.features[key].title}</dt>
                <dd className="text-neutral-600 sm:col-span-2 dark:text-neutral-400">{t.features[key].description}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <p className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-neutral-600 dark:text-neutral-400">
          <a href="https://www.techniflows.com" target="_blank" rel="noopener noreferrer" className={textLink}>
            {format(t.footer.copyright, { year: new Date().getFullYear() })}
          </a>
        </p>
      </footer>

      <PWAInstall />
    </div>
  );
}
