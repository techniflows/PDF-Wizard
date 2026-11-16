import {
  PDFArray,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  type PDFContext,
  type PDFDocument,
  type PDFObject,
} from 'pdf-lib';
import { canvasToBlob } from './pdfUtils';

export interface ImageRecompression {
  jpegQuality: number;
  maxLongEdge: number;
}

type Channels = 1 | 3;

interface Candidate {
  bytes: Uint8Array;
  width: number;
  height: number;
  // The lossless candidate keeps the source colour space, so it records the channel count.
  encoding: 'jpeg' | { flateChannels: Channels };
}

// Below this size the stream and dictionary overhead outweighs any saving.
const MIN_STREAM_BYTES = 4096;

// Rasterized text and line art deflate well and smear under JPEG, while photos
// deflate badly. The lossy candidate is taken only when it wins by a wide margin.
const JPEG_MUST_BEAT_LOSSLESS_BY = 0.5;

const CHANNELS_BY_FAMILY: Record<string, Channels> = {
  '/DeviceGray': 1,
  '/CalGray': 1,
  '/DeviceRGB': 3,
  '/CalRGB': 3,
};

const key = (name: string) => PDFName.of(name);

// Filter and DecodeParms may each be wrapped in a one-element array.
const unwrapSingle = (object: PDFObject | undefined): PDFObject | undefined =>
  object instanceof PDFArray && object.size() === 1 ? object.lookup(0) : object;

const numberAt = (dict: PDFDict, name: string): number | undefined => {
  const value = dict.lookup(key(name));
  return value instanceof PDFNumber ? value.asNumber() : undefined;
};

// Indexed, CMYK, Lab, Separation and DeviceN samples cannot go through an RGB
// canvas and come back meaning the same thing, so they report null.
function channelsOf(colorSpace: PDFObject | undefined, context: PDFContext): Channels | null {
  const resolved = colorSpace instanceof PDFRef ? context.lookup(colorSpace) : colorSpace;
  if (resolved instanceof PDFName) return CHANNELS_BY_FAMILY[resolved.asString()] ?? null;
  if (!(resolved instanceof PDFArray) || resolved.size() === 0) return null;

  const family = resolved.lookup(0);
  if (!(family instanceof PDFName)) return null;
  if (family.asString() !== '/ICCBased') return CHANNELS_BY_FAMILY[family.asString()] ?? null;

  const profile = resolved.size() > 1 ? resolved.lookup(1) : undefined;
  const components = profile instanceof PDFRawStream ? numberAt(profile.dict, 'N') : undefined;
  return components === 1 || components === 3 ? components : null;
}

const pipeThrough = async (bytes: Uint8Array, transform: CompressionStream | DecompressionStream) =>
  new Uint8Array(await new Response(new Blob([bytes.slice()]).stream().pipeThrough(transform)).arrayBuffer());

function fitLongEdge(width: number, height: number, maxLongEdge: number) {
  const scale = Math.min(1, maxLongEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function drawScaled(source: ImageBitmap, width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  return context;
}

const encodeJpeg = async (canvas: HTMLCanvasElement, quality: number) =>
  new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', quality)).arrayBuffer());

// A browser applies the EXIF orientation (APP1) and the embedded ICC profile
// (APP2) when it decodes a JPEG. A PDF viewer applies neither, so both segments
// are dropped to get the same pixels the viewer shows.
function withoutExifAndIcc(jpeg: Uint8Array): Blob {
  const kept = [jpeg.slice(0, 2)];
  let offset = 2;
  while (offset + 4 <= jpeg.length && jpeg[offset] === 0xff && jpeg[offset + 1] !== 0xda) {
    const end = offset + 2 + ((jpeg[offset + 2] << 8) | jpeg[offset + 3]);
    const marker = jpeg[offset + 1];
    if (marker !== 0xe1 && marker !== 0xe2) kept.push(jpeg.slice(offset, end));
    offset = end;
  }
  kept.push(jpeg.slice(offset));
  return new Blob(kept, { type: 'image/jpeg' });
}

async function recompressJpeg(jpeg: Uint8Array, params: ImageRecompression): Promise<Candidate> {
  const bitmap = await createImageBitmap(withoutExifAndIcc(jpeg));
  try {
    const { width, height } = fitLongEdge(bitmap.width, bitmap.height, params.maxLongEdge);
    const { canvas } = drawScaled(bitmap, width, height);
    return { bytes: await encodeJpeg(canvas, params.jpegQuality), width, height, encoding: 'jpeg' };
  } finally {
    bitmap.close();
  }
}

// PDF predictors 10 to 15 store each row as a PNG filter byte followed by the filtered samples.
function undoPngPredictor(filtered: Uint8Array, stride: number, height: number, channels: Channels): Uint8Array | null {
  const rowSize = stride + 1;
  if (filtered.length !== rowSize * height) return null;
  const out = new Uint8Array(stride * height);

  for (let y = 0; y < height; y++) {
    const filterType = filtered[y * rowSize];
    if (filterType > 4) return null;
    const row = y * stride;
    const above = row - stride;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[row + x - channels] : 0;
      const b = y > 0 ? out[above + x] : 0;
      const c = x >= channels && y > 0 ? out[above + x - channels] : 0;
      let predicted = 0;
      if (filterType === 1) predicted = a;
      else if (filterType === 2) predicted = b;
      else if (filterType === 3) predicted = (a + b) >> 1;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        predicted = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[row + x] = (filtered[y * rowSize + 1 + x] + predicted) & 0xff;
    }
  }
  return out;
}

// Consecutive rows of document imagery are close to each other, so storing
// each row as its difference from the row above deflates much better.
function applyUpPredictor(samples: Uint8Array, stride: number, height: number): Uint8Array {
  const out = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const outRow = y * (stride + 1);
    out[outRow] = 2;
    for (let x = 0; x < stride; x++) {
      const above = y > 0 ? samples[(y - 1) * stride + x] : 0;
      out[outRow + 1 + x] = (samples[y * stride + x] - above) & 0xff;
    }
  }
  return out;
}

function toImageData(samples: Uint8Array, width: number, height: number, channels: Channels): ImageData {
  const imageData = new ImageData(width, height);
  const rgba = imageData.data;
  for (let i = 0; i < width * height; i++) {
    const source = i * channels;
    rgba[i * 4] = samples[source];
    rgba[i * 4 + 1] = samples[channels === 3 ? source + 1 : source];
    rgba[i * 4 + 2] = samples[channels === 3 ? source + 2 : source];
    rgba[i * 4 + 3] = 255;
  }
  return imageData;
}

function toSamples(imageData: ImageData, channels: Channels): Uint8Array {
  const rgba = imageData.data;
  const samples = new Uint8Array(imageData.width * imageData.height * channels);
  for (let i = 0; i < imageData.width * imageData.height; i++) {
    for (let channel = 0; channel < channels; channel++) {
      samples[i * channels + channel] = rgba[i * 4 + channel];
    }
  }
  return samples;
}

async function recompressFlate(
  stream: PDFRawStream,
  channels: Channels,
  params: ImageRecompression
): Promise<Candidate | null> {
  const sourceWidth = numberAt(stream.dict, 'Width');
  const sourceHeight = numberAt(stream.dict, 'Height');
  if (!sourceWidth || !sourceHeight || numberAt(stream.dict, 'BitsPerComponent') !== 8) return null;

  const decodeParms = unwrapSingle(stream.dict.lookup(key('DecodeParms')));
  const predictor = (decodeParms instanceof PDFDict ? numberAt(decodeParms, 'Predictor') : undefined) ?? 1;
  const stride = sourceWidth * channels;

  let samples: Uint8Array | null = await pipeThrough(stream.contents, new DecompressionStream('deflate'));
  if (predictor >= 10 && predictor <= 15) {
    samples = undoPngPredictor(samples, stride, sourceHeight, channels);
  } else if (predictor !== 1 || samples.length !== stride * sourceHeight) {
    // Predictor 2 is the TIFF predictor, which is not decoded here.
    return null;
  }
  if (!samples) return null;

  const { width, height } = fitLongEdge(sourceWidth, sourceHeight, params.maxLongEdge);
  const bitmap = await createImageBitmap(toImageData(samples, sourceWidth, sourceHeight, channels));
  let context: CanvasRenderingContext2D;
  try {
    context = drawScaled(bitmap, width, height);
  } finally {
    bitmap.close();
  }
  if (width !== sourceWidth || height !== sourceHeight) {
    samples = toSamples(context.getImageData(0, 0, width, height), channels);
  }

  const lossless = await pipeThrough(
    applyUpPredictor(samples, width * channels, height),
    new CompressionStream('deflate')
  );
  const jpeg = await encodeJpeg(context.canvas, params.jpegQuality);

  return jpeg.length < lossless.length * JPEG_MUST_BEAT_LOSSLESS_BY
    ? { bytes: jpeg, width, height, encoding: 'jpeg' }
    : { bytes: lossless, width, height, encoding: { flateChannels: channels } };
}

function isImage(object: PDFObject): object is PDFRawStream {
  return object instanceof PDFRawStream && object.dict.get(key('Subtype')) === key('Image');
}

async function recompressImages(context: PDFContext, params: ImageRecompression): Promise<number> {
  const images = context.enumerateIndirectObjects().filter((entry): entry is [PDFRef, PDFRawStream] => isImage(entry[1]));

  // A soft mask has to keep its exact samples and stay in step with the image it masks.
  const masks = new Set<PDFObject>();
  for (const [, image] of images) {
    for (const name of ['SMask', 'Mask']) {
      const mask = image.dict.get(key(name));
      if (mask instanceof PDFRef) masks.add(mask);
    }
  }

  let replaced = 0;
  for (const [ref, image] of images) {
    const { dict } = image;
    // JPEG has no alpha, and a /Decode array remaps samples in a way the canvas round trip would lose.
    if (masks.has(ref) || ['SMask', 'Mask', 'ImageMask', 'Decode'].some((name) => dict.has(key(name)))) continue;
    if (image.contents.length < MIN_STREAM_BYTES) continue;

    const channels = channelsOf(dict.get(key('ColorSpace')), context);
    if (!channels) continue;

    // Anything else (JPX, CCITT, JBIG2, a chain of filters) is left alone.
    const filter = unwrapSingle(dict.lookup(key('Filter')));
    let candidate: Candidate | null;
    try {
      if (filter === key('DCTDecode') && !dict.has(key('DecodeParms'))) {
        candidate = await recompressJpeg(image.contents, params);
      } else if (filter === key('FlateDecode')) {
        candidate = await recompressFlate(image, channels, params);
      } else {
        continue;
      }
    } catch {
      // An image this browser cannot decode stays as it is.
      continue;
    }
    if (!candidate || candidate.bytes.length >= image.contents.length) continue;

    dict.set(key('Width'), PDFNumber.of(candidate.width));
    dict.set(key('Height'), PDFNumber.of(candidate.height));
    if (candidate.encoding === 'jpeg') {
      dict.set(key('Filter'), key('DCTDecode'));
      dict.delete(key('DecodeParms'));
      // The canvas always encodes three components, which a one-channel colour space cannot describe.
      if (channels === 1) dict.set(key('ColorSpace'), key('DeviceRGB'));
    } else {
      dict.set(key('Filter'), key('FlateDecode'));
      dict.set(
        key('DecodeParms'),
        context.obj({
          Predictor: 12,
          Columns: candidate.width,
          Colors: candidate.encoding.flateChannels,
          BitsPerComponent: 8,
        })
      );
    }
    context.assign(ref, PDFRawStream.of(dict, candidate.bytes));
    replaced++;
  }
  return replaced;
}

// Recompresses the images embedded in `doc` and leaves every other object as
// it is, so text stays text. The result is never larger than `doc` saved as is.
export async function compressPdfImages(
  doc: PDFDocument,
  params: ImageRecompression
): Promise<{ bytes: Uint8Array; originalSize: number }> {
  const original = await doc.save();
  const compressed = (await recompressImages(doc.context, params)) > 0 ? await doc.save() : original;
  return {
    bytes: compressed.length < original.length ? compressed : original,
    originalSize: original.length,
  };
}
