// Run with `node utils/__checks__/pdfImageCompression.check.mjs` (Node 24).
// Node has no canvas, so sharp stands in for the browser's JPEG codec. The PDF
// rewriting under test is the real module. Sizes printed here are not the
// sizes a browser produces.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PDFDocument, PDFName, PDFRawStream, StandardFonts } from 'pdf-lib';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});

globalThis.ImageData = class {
  constructor(width, height) {
    Object.assign(this, { width, height, data: new Uint8ClampedArray(width * height * 4) });
  }
};

// sharp's rotate() applies the EXIF orientation, as a browser does when it decodes.
globalThis.createImageBitmap = async (source) => {
  if (!(source instanceof Blob)) return { ...source, close() {} };
  const { data, info } = await sharp(Buffer.from(await source.arrayBuffer()))
    .rotate()
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data, close() {} };
};

globalThis.document = {
  createElement() {
    const canvas = {
      width: 0,
      height: 0,
      pixels: null,
      getContext: () => context,
      toBlob(callback, _type, quality) {
        sharp(canvas.pixels, { raw: { width: canvas.width, height: canvas.height, channels: 4 } })
          .removeAlpha()
          .jpeg({ quality: Math.round(quality * 100) })
          .toBuffer()
          .then((buffer) => callback(new Blob([buffer])));
      },
    };
    const context = {
      canvas,
      drawImage(source, _x, _y, width, height) {
        canvas.pixels = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y++) {
          const sourceY = Math.min(source.height - 1, Math.floor((y * source.height) / height));
          for (let x = 0; x < width; x++) {
            const sourceX = Math.min(source.width - 1, Math.floor((x * source.width) / width));
            const from = (sourceY * source.width + sourceX) * 4;
            canvas.pixels.set(source.data.subarray(from, from + 4), (y * width + x) * 4);
          }
        }
      },
      getImageData: (_x, _y, width, height) => ({ width, height, data: canvas.pixels }),
    };
    return canvas;
  },
};

const { compressPdfImages } = await import('../pdfImageCompression.ts');
const { assemblePdfPages } = await import('../pdfCompression.ts');
const { getImageRecompression } = await import('../pdfUtils.ts');

// Smooth colour with mild noise deflates badly and suits JPEG, like a photo.
async function photo(width, height) {
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const noise = Math.random() * 24;
      pixels[i] = 110 + 100 * Math.sin(x / 90) + noise;
      pixels[i + 1] = 110 + 100 * Math.cos(y / 70) + noise;
      pixels[i + 2] = 110 + 100 * Math.sin((x + y) / 120) + noise;
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } });
}

// Flat blocks deflate to almost nothing, like a screenshot.
function flatArt(width, height) {
  const pixels = Buffer.alloc(width * height * 3, 255);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((Math.floor(x / 40) + Math.floor(y / 40)) % 2) pixels.fill(20, (y * width + x) * 3, (y * width + x) * 3 + 3);
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } });
}

const TEXT = ['Selectable text on page one', 'Selectable text on page two', 'A page with text only'];

async function buildSource() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const images = {
    photoJpeg: await doc.embedJpg(await (await photo(3600, 2400)).jpeg({ quality: 95 }).toBuffer()),
    rotatedJpeg: await doc.embedJpg(
      await (await photo(1200, 800)).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer()
    ),
    cmykJpeg: await doc.embedJpg(await (await photo(900, 600)).toColourspace('cmyk').jpeg({ quality: 95 }).toBuffer()),
    photoPng: await doc.embedPng(await (await photo(1000, 700)).png().toBuffer()),
    artPng: await doc.embedPng(await flatArt(4000, 3000).png({ compressionLevel: 0 }).toBuffer()),
    alphaPng: await doc.embedPng(await (await photo(600, 400)).ensureAlpha(0.5).png().toBuffer()),
    tinyJpeg: await doc.embedJpg(await (await photo(40, 30)).jpeg().toBuffer()),
  };

  const placements = [
    ['photoJpeg', 'rotatedJpeg', 'cmykJpeg', 'tinyJpeg'],
    ['photoJpeg', 'photoPng', 'artPng', 'alphaPng'],
    [],
  ];
  placements.forEach((names, index) => {
    const page = doc.addPage([595, 842]);
    page.drawText(TEXT[index], { x: 40, y: 800, size: 14, font });
    names.forEach((name, slot) => page.drawImage(images[name], { x: 40, y: 600 - slot * 190, width: 240, height: 160 }));
  });
  return new Blob([await doc.save()]);
}

function imageStreams(doc) {
  return doc.context
    .enumerateIndirectObjects()
    .filter(([, object]) => object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'))
    .map(([, stream]) => stream);
}

const describe = (stream) =>
  `${stream.dict.get(PDFName.of('Width'))}x${stream.dict.get(PDFName.of('Height'))} ${stream.dict.get(PDFName.of('Filter'))} ${stream.dict.get(PDFName.of('ColorSpace'))}`;

const contentBytes = (doc) =>
  doc.getPages().map((page) => Buffer.from(doc.context.lookup(page.node.Contents().get(0)).contents).toString('latin1'));

async function readWithPdfJs(bytes) {
  const pdf = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  const pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const text = (await page.getTextContent()).items.map((item) => item.str).join('');
    const operators = await page.getOperatorList();
    const images = [];
    for (const [index, fn] of operators.fnArray.entries()) {
      if (fn !== OPS.paintImageXObject) continue;
      const [id] = operators.argsArray[index];
      const decoded = await new Promise((resolve) => (id.startsWith('g_') ? page.commonObjs : page.objs).get(id, resolve));
      assert.ok(decoded?.width > 0 && (decoded.data || decoded.bitmap), `pdf.js decoded image ${id}`);
      images.push(`${decoded.width}x${decoded.height}`);
    }
    pages.push({ text, size: page.view.join(','), operators: operators.fnArray.length, images });
  }
  await pdf.destroy();
  return pages;
}

const source = await buildSource();
const pages = [1, 2, 3].map((pageNumber) => ({ blob: source, pageNumber }));
const sizes = {};

for (const level of ['low', 'medium', 'high']) {
  const assembled = await assemblePdfPages(pages);
  const baseline = await PDFDocument.load(await assembled.save());
  const { bytes, originalSize } = await compressPdfImages(assembled, getImageRecompression(level));
  const output = await PDFDocument.load(bytes);
  sizes[level] = `${originalSize} -> ${bytes.length}`;

  // Two saves differ by a byte or two because the compressed metadata carries the save time.
  const plainSize = (await (await assemblePdfPages(pages)).save()).length;
  assert.ok(Math.abs(originalSize - plainSize) < 16, 'baseline is the plain assembly');
  assert.ok(bytes.length < originalSize, 'output is smaller');
  assert.equal(output.getPageCount(), 3, 'page count kept');
  assert.deepEqual(contentBytes(output), contentBytes(baseline), 'content streams are byte-identical');

  const before = imageStreams(baseline);
  const after = imageStreams(output);
  assert.equal(after.length, before.length, 'no image object added or dropped');
  assert.equal(before.filter((stream) => describe(stream).startsWith('3600x2400')).length, 1, 'shared photo assembled once');

  const maxLongEdge = getImageRecompression(level).maxLongEdge;
  const changed = [];
  before.forEach((stream, index) => {
    const result = after[index];
    const same = Buffer.compare(Buffer.from(stream.contents), Buffer.from(result.contents)) === 0;
    if (!same) changed.push(`${describe(stream)} => ${describe(result)}`);
    assert.ok(result.contents.length <= stream.contents.length, 'no image stream grew');

    const untouchable =
      ['SMask', 'Decode'].some((name) => stream.dict.has(PDFName.of(name))) ||
      before.some((other) => other.dict.get(PDFName.of('SMask')) && other.dict.lookup(PDFName.of('SMask')) === stream) ||
      stream.contents.length < 4096;
    if (untouchable) assert.ok(same, `${describe(stream)} left untouched`);
    if (!same) {
      const longEdge = Math.max(result.dict.lookup(PDFName.of('Width')).asNumber(), result.dict.lookup(PDFName.of('Height')).asNumber());
      assert.ok(longEdge <= maxLongEdge, 'long edge capped');
    }
  });
  if (level === 'high') {
    assert.ok(changed.some((line) => line.startsWith('1200x800') && line.includes('=> 1200x800')), 'EXIF orientation not applied');
    assert.ok(changed.some((line) => line.startsWith('1000x700 /FlateDecode') && line.includes('/DCTDecode')), 'Flate photo became JPEG');
    assert.ok(changed.some((line) => line.startsWith('4000x3000 /FlateDecode') && line.includes('=> 1800x1350 /FlateDecode')), 'Flate line art stayed lossless');
    process.stdout.write(`${changed.join('\n')}\n`);
  }

  const read = await readWithPdfJs(bytes);
  assert.deepEqual(read.map((page) => page.text), TEXT, 'pdf.js still extracts the text');
  const expected = await readWithPdfJs(await baseline.save());
  const layout = ({ size, operators, images }) => ({ size, operators, images: images.length });
  assert.deepEqual(read.map(layout), expected.map(layout), 'pdf.js sees the same page sizes, operators and image count');
  if (level === 'high') process.stdout.write(`pdf.js decoded: ${JSON.stringify(read.map((page) => page.images))}\n`);
}

const textOnly = [{ blob: source, pageNumber: 3 }];
const textResult = await compressPdfImages(await assemblePdfPages(textOnly), getImageRecompression('high'));
assert.equal(textResult.bytes.length, textResult.originalSize, 'a page without images is returned as assembled');

const reordered = await assemblePdfPages([3, 1].map((pageNumber) => ({ blob: source, pageNumber })));
assert.deepEqual(
  (await readWithPdfJs(await reordered.save())).map((page) => page.text),
  [TEXT[2], TEXT[0]],
  'pages follow list order'
);
assert.equal(imageStreams(reordered).length, 4, 'only images of the included pages are assembled');

process.stdout.write(`${JSON.stringify(sizes, null, 2)}\nall checks passed\n`);
