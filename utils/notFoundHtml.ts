import { LOCALES, getTranslations, type Language } from './i18n';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

function notFoundHtml(lang: Language): string {
  const t = getTranslations(lang);
  const locale = LOCALES[lang];

  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale.htmlLang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(`${t.notFound.title} | ${t.brand}`)}</title>
<style>
:root { color-scheme: light dark; --background: #ffffff; --foreground: #171717; --muted: #525252; --link: #2563eb; }
@media (prefers-color-scheme: dark) {
  :root { --background: #0a0a0a; --foreground: #f5f5f5; --muted: #a3a3a3; --link: #60a5fa; }
}
body {
  margin: 0; min-height: 100vh; display: flex; align-items: center; padding: 16px; box-sizing: border-box;
  background: var(--background); color: var(--foreground); line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif;
}
main { width: 100%; max-width: 48rem; margin: 0 auto; }
h1 { margin: 0 0 12px; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.025em; }
p { margin: 0 0 4px; color: var(--muted); }
a { display: inline-block; margin-top: 16px; padding: 10px 0; color: var(--link); }
</style>
</head>
<body>
<main>
<p>404</p>
<h1>${escapeHtml(t.notFound.title)}</h1>
<p>${escapeHtml(t.notFound.description)}</p>
<a href="${escapeHtml(locale.path)}">${escapeHtml(t.notFound.home)}</a>
</main>
</body>
</html>
`;
}

export function notFoundResponse(lang: Language): Response {
  return new Response(notFoundHtml(lang), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
