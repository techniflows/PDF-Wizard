import { LOCALES, getTranslations, type Language } from './i18n';

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

const icon = (size: number, purpose: 'any' | 'maskable') => ({
  src: `/icon-${size}x${size}.png`,
  sizes: `${size}x${size}`,
  type: 'image/png',
  purpose,
});

function buildManifest(lang: Language) {
  const t = getTranslations(lang);
  const locale = LOCALES[lang];

  return {
    id: locale.path,
    name: t.brand,
    short_name: t.brand,
    description: t.meta.description,
    lang: locale.htmlLang,
    start_url: locale.path,
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    categories: ['productivity', 'utilities'],
    icons: [...ICON_SIZES.map((size) => icon(size, 'any')), ...MASKABLE_SIZES.map((size) => icon(size, 'maskable'))],
    prefer_related_applications: false,
    edge_side_panel: { preferred_width: 480 },
    launch_handler: { client_mode: 'navigate-existing' },
  };
}

export function manifestResponse(lang: Language): Response {
  return new Response(JSON.stringify(buildManifest(lang)), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
