'use client';

import { useEffect } from 'react';
import { LANGUAGES, LOCALES, type Language } from '@/utils/i18n';
import { textLink } from './styles';

const CHOICE_KEY = 'pdfwizard-language';

function rememberChoice(lang: Language) {
  try {
    localStorage.setItem(CHOICE_KEY, lang);
  } catch {}
}

// When storage is unreadable a choice can never be recorded, so redirecting
// would send the visitor back every time they switch language by hand.
function preferredLanguage(): Language | undefined {
  let stored: string | null;
  try {
    stored = localStorage.getItem(CHOICE_KEY);
  } catch {
    return undefined;
  }

  const browserLanguage = navigator.language.toLowerCase();
  return LANGUAGES.find((lang) =>
    stored === null ? browserLanguage.startsWith(LOCALES[lang].htmlLang) : lang === stored
  );
}

export function LanguageSwitch({ current }: { current: Language }) {
  return (
    <nav className="flex gap-4 text-sm">
      {LANGUAGES.filter((lang) => lang !== current).map((lang) => (
        <a
          key={lang}
          href={LOCALES[lang].path}
          hrefLang={LOCALES[lang].htmlLang}
          lang={LOCALES[lang].htmlLang}
          onClick={() => rememberChoice(lang)}
          className={`inline-flex min-h-11 items-center ${textLink}`}
        >
          {LOCALES[lang].label}
        </a>
      ))}
    </nav>
  );
}

export function BrowserLanguageRedirect({ from }: { from: Language }) {
  useEffect(() => {
    const preferred = preferredLanguage();
    if (preferred && preferred !== from) {
      location.replace(LOCALES[preferred].path);
    }
  }, [from]);

  return null;
}
