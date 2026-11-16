// Renders the 1200x630 share images into public/. Run: node utils/generateOgImages.js
// Text is drawn with fonts installed on this machine, so run it where a Korean font exists.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const sharp = require('sharp');
const ts = require('typescript');

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 80;
const ICON_SIZE = 96;
const HEADING_SIZE = 72;
const HEADING_LINE_HEIGHT = 92;
const FONT_FAMILY = "'Helvetica Neue', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif";

const publicDir = path.join(__dirname, '..', 'public');

// The site copy lives in i18n.ts, so it is compiled here instead of being copied.
function loadI18n() {
  const file = path.join(__dirname, 'i18n.ts');
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const compiled = new Module(file);
  compiled._compile(outputText, file);
  return compiled.exports;
}

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// SVG text does not wrap. Hangul and other wide glyphs take about a full em, Latin about half.
const estimateWidth = (text, fontSize) =>
  [...text].reduce((width, character) => width + (character.charCodeAt(0) > 0x2e7f ? 1 : 0.56) * fontSize, 0);

function wrap(text, fontSize, maxWidth) {
  const lines = [];
  for (const word of text.split(' ')) {
    const candidate = lines.length > 0 ? `${lines[lines.length - 1]} ${word}` : word;
    if (lines.length > 0 && estimateWidth(candidate, fontSize) <= maxWidth) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

async function generate() {
  const { LANGUAGES, LOCALES, getTranslations } = loadI18n();
  const icon = await sharp(path.join(publicDir, 'icon-512x512.png')).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();

  for (const lang of LANGUAGES) {
    const t = getTranslations(lang);
    const lines = wrap(t.heading, HEADING_SIZE, WIDTH - MARGIN * 2);
    const headingTop = 350 - ((lines.length - 1) * HEADING_LINE_HEIGHT) / 2;
    const heading = lines
      .map((line, index) => `<tspan x="${MARGIN}" y="${headingTop + index * HEADING_LINE_HEIGHT}">${escapeXml(line)}</tspan>`)
      .join('');

    const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
      <g font-family="${FONT_FAMILY}">
        <text x="${MARGIN + ICON_SIZE + 28}" y="${MARGIN + ICON_SIZE / 2 + 13}" font-size="38" font-weight="600" fill="#171717">${escapeXml(t.brand)}</text>
        <text font-size="${HEADING_SIZE}" font-weight="700" fill="#0a0a0a">${heading}</text>
        <text x="${MARGIN}" y="${HEIGHT - MARGIN}" font-size="30" fill="#737373">pdfwizard.dev</text>
      </g>
    </svg>`;

    const output = path.join(publicDir, LOCALES[lang].ogImage);
    await sharp(Buffer.from(svg))
      .composite([{ input: icon, left: MARGIN, top: MARGIN }])
      .png()
      .toFile(output);
    console.log(`Generated ${path.relative(process.cwd(), output)}`);
  }
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
