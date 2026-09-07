import {
  PDFArray,
  PDFContext,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFRawStream,
  PDFRef,
} from 'pdf-lib';

// MozJPEG (WASM) JPEG encoder — produces standard baseline/progressive JPEG
// bytes that any PDF reader accepts via /DCTDecode, but typically 10–20%
// smaller than canvas.toBlob at the same visual quality. Lazily loaded so
// users who never enable compression don't pay for the WASM download.
type MozjpegEncode = (
  data: ImageData,
  options?: { quality?: number }
) => Promise<ArrayBuffer>;

let mozjpegLoader: Promise<MozjpegEncode | null> | null = null;

const getMozjpegEncoder = (): Promise<MozjpegEncode | null> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!mozjpegLoader) {
    mozjpegLoader = import('@jsquash/jpeg/encode')
      .then(m => m.default as MozjpegEncode)
      .catch(err => {
        console.warn('MozJPEG unavailable, falling back to canvas:', err);
        return null;
      });
  }
  return mozjpegLoader;
};

// Encode ImageData → JPEG bytes. Tries MozJPEG first; falls back to canvas
// .toBlob if the WASM module fails to load (e.g. unsupported browser).
const encodeImageDataAsJpeg = async (
  imageData: ImageData,
  quality01: number
): Promise<Uint8Array | null> => {
  const q01 = Math.max(0.1, Math.min(1, quality01));
  const encode = await getMozjpegEncoder();
  if (encode) {
    try {
      const buf = await encode(imageData, { quality: Math.round(q01 * 100) });
      return new Uint8Array(buf);
    } catch (err) {
      console.warn('MozJPEG encode failed, falling back to canvas:', err);
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(imageData, 0, 0);
  const blob: Blob | null = await new Promise(res =>
    canvas.toBlob(res, 'image/jpeg', q01)
  );
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
};

export const loadPdfJs = async () => {
  if (typeof window === 'undefined') return null;
  
  const pdfjsLib = await import('pdfjs-dist');
  
  // Bundle the worker that ships with the installed pdfjs-dist so the API and
  // worker versions always match (a stale copy in /public caused
  // "API version X does not match Worker version Y" and broke uploads).
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  
  return pdfjsLib;
};

// Generate thumbnail for a PDF page. Renders via pdf.js with intent="print",
// which uses pdf.js's higher-fidelity font path — it falls back more
// gracefully when an embedded CJK font subset is missing a `glyf` table, so
// titles and decorative type render with fewer dropped strokes.
const generatePageThumbnail = async (pdf: any, pageNumber: number): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNumber);
    // Higher scale = crisper thumbnail when the user opens the zoomed preview.
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
      intent: 'print',
    }).promise;
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return '';
  }
};

// Image compression for PDF embedding.
//
// Goals:
//   1. Never lose an image. Even WebP/AVIF/GIF/BMP inputs produce a valid
//      candidate (canvas → PNG/JPEG) so pdf-lib can always embed something.
//   2. Never inflate. The original bytes are always a candidate when the
//      format is one pdf-lib supports (sniffed by magic bytes, not MIME).
//   3. Try several strategies and pick the smallest:
//        - Original (when JPEG/PNG)
//        - JPEG re-encode at native resolution
//        - JPEG re-encode at downscaled resolution
//        - PNG re-encode at downscaled resolution (when source has alpha)
//      Slider value lowers JPEG quality AND caps the long edge.
//   4. Format choice is data-driven: whichever candidate produces the smallest
//      bytes wins, and we embed using the matching pdf-lib API.

export type ImageFormat = 'jpeg' | 'png';

export interface CompressedImage {
  bytes: ArrayBuffer;
  format: ImageFormat;
}

const MAGIC_PNG = [0x89, 0x50, 0x4e, 0x47] as const;
const MAGIC_JPEG = [0xff, 0xd8, 0xff] as const;

const sniffImageFormat = (bytes: ArrayBuffer): ImageFormat | null => {
  if (bytes.byteLength < 4) return null;
  const head = new Uint8Array(bytes, 0, 8);
  if (MAGIC_PNG.every((b, i) => head[i] === b)) return 'png';
  if (MAGIC_JPEG.every((b, i) => head[i] === b)) return 'jpeg';
  return null;
};

const renderToBlob = async (
  source: ImageBitmap,
  width: number,
  height: number,
  format: ImageFormat,
  quality?: number
): Promise<{ bytes: ArrayBuffer; canvas: HTMLCanvasElement } | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (format === 'jpeg') {
    // JPEG has no alpha channel — flatten any transparency to white so the
    // image doesn't render as a black silhouette.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  if (format === 'jpeg') {
    const imageData = ctx.getImageData(0, 0, width, height);
    const bytes = await encodeImageDataAsJpeg(imageData, quality ?? 0.9);
    if (!bytes) return null;
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return { bytes: ab, canvas };
  }

  const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return null;
  return { bytes: await blob.arrayBuffer(), canvas };
};

// Map slider value (10..100) to a long-edge cap in pixels.
// q=100 → no cap (preserve native resolution). q=10 → ~700px.
const pickMaxLongEdge = (q: number): number => {
  if (q >= 100) return Infinity;
  const clamped = Math.max(10, Math.min(100, q));
  return Math.round(700 + ((clamped - 10) / 90) * 3300);
};

// Sample a small thumbnail of the source canvas to detect any non-opaque pixel.
// Cheap O(SAMPLE^2) regardless of native resolution.
const detectAlpha = (source: ImageBitmap): boolean => {
  try {
    const SAMPLE = 64;
    const w = Math.min(SAMPLE, source.width);
    const h = Math.min(SAMPLE, source.height);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(source, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const compressImageForEmbed = async (
  bytes: ArrayBuffer,
  mimeType: string,
  options: { enabled: boolean; quality: number }
): Promise<CompressedImage> => {
  const sniffed = sniffImageFormat(bytes);

  // Try to decode. createImageBitmap supports JPEG/PNG/WebP/GIF/BMP/SVG/AVIF
  // (browser-dependent). If decoding fails entirely, fall back to original
  // bytes provided pdf-lib can read them.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
  } catch (err) {
    if (sniffed) return { bytes, format: sniffed };
    throw err;
  }

  // No-compression path: prefer original (when sniffable), else convert to a
  // canvas-PNG so the image is still embeddable. This guarantees the image
  // never disappears even for WebP/AVIF/GIF inputs the user dragged in.
  if (!options.enabled) {
    if (sniffed) {
      bitmap.close?.();
      return { bytes, format: sniffed };
    }
    const fallback = await renderToBlob(bitmap, bitmap.width, bitmap.height, 'png');
    bitmap.close?.();
    if (!fallback) throw new Error('Failed to encode image as PNG');
    return { bytes: fallback.bytes, format: 'png' };
  }

  // Compression-enabled path: build candidates and pick the smallest.
  // The original bytes are intentionally NOT a candidate here — including
  // them would let an already-compact source dominate every slider value
  // and make the slider feel inert. Compression is opt-in; the user
  // expects the slider to actually drive output size.
  const candidates: CompressedImage[] = [];

  const q = options.quality / 100;
  const hasAlpha = detectAlpha(bitmap);

  // JPEG at native resolution (always — flattens alpha to white if needed).
  const jpegNative = await renderToBlob(bitmap, bitmap.width, bitmap.height, 'jpeg', q);
  if (jpegNative) candidates.push({ bytes: jpegNative.bytes, format: 'jpeg' });

  // PNG at native resolution only if alpha matters AND source isn't already
  // a PNG (otherwise we'd be regenerating a strictly worse copy).
  if (hasAlpha && sniffed !== 'png') {
    const pngNative = await renderToBlob(bitmap, bitmap.width, bitmap.height, 'png');
    if (pngNative) candidates.push({ bytes: pngNative.bytes, format: 'png' });
  }

  // Resolution-capped candidates.
  const maxLong = pickMaxLongEdge(options.quality);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (Number.isFinite(maxLong) && longest > maxLong) {
    const scale = maxLong / longest;
    const dw = Math.max(1, Math.round(bitmap.width * scale));
    const dh = Math.max(1, Math.round(bitmap.height * scale));

    const jpegScaled = await renderToBlob(bitmap, dw, dh, 'jpeg', q);
    if (jpegScaled) candidates.push({ bytes: jpegScaled.bytes, format: 'jpeg' });

    if (hasAlpha) {
      const pngScaled = await renderToBlob(bitmap, dw, dh, 'png');
      if (pngScaled) candidates.push({ bytes: pngScaled.bytes, format: 'png' });
    }
  }

  // Last-resort guarantee: if nothing else worked, embed a native PNG so the
  // image is never silently dropped.
  if (candidates.length === 0) {
    const lastResort = await renderToBlob(bitmap, bitmap.width, bitmap.height, 'png');
    bitmap.close?.();
    if (!lastResort) throw new Error('Failed to encode image in any format');
    return { bytes: lastResort.bytes, format: 'png' };
  }

  bitmap.close?.();
  candidates.sort((a, b) => a.bytes.byteLength - b.bytes.byteLength);
  return candidates[0];
};

// Rasterize a single PDF page into a JPEG bitmap that can be re-embedded as an
// image. Trades vector text for genuine, slider-controllable size reduction —
// the only compression strategy that meaningfully shrinks PDFs in the browser.
//
// `quality` is the slider value (10..100) and drives both:
//   - the rendering DPI (lower q → coarser raster, fewer pixels)
//   - the JPEG encoder quality
export interface RasterizedPdfPage {
  jpegBytes: ArrayBuffer;
  widthPt: number;
  heightPt: number;
}

export const rasterizePdfPage = async (
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  options: { quality: number }
): Promise<RasterizedPdfPage> => {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) throw new Error('pdfjs-dist failed to load');

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(pageIndex + 1);

  const q = Math.max(10, Math.min(100, options.quality));
  // Map q → DPI. q=100 ≈ 220 DPI (print-ish), q=10 ≈ 64 DPI (low-fi).
  const dpi = Math.round(56 + (q / 100) * 164);
  const scale = dpi / 72;

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D canvas context');

  // White background — rendering transparent PDFs would otherwise produce
  // black on JPEG since JPEG has no alpha channel.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const jpegBytes = await encodeImageDataAsJpeg(imageData, q / 100);
  if (!jpegBytes) throw new Error('Failed to encode rasterized page as JPEG');

  // Original page size in points (1/72 inch) — preserved so the embedded
  // raster ends up at the same physical size as the source page.
  const naturalViewport = page.getViewport({ scale: 1 });
  return {
    jpegBytes: jpegBytes.buffer.slice(
      jpegBytes.byteOffset,
      jpegBytes.byteOffset + jpegBytes.byteLength
    ) as ArrayBuffer,
    widthPt: naturalViewport.width,
    heightPt: naturalViewport.height,
  };
};

// Image-only PDF compression: walk every indirect object, find Image XObjects,
// decode them, and re-encode as JPEG at the requested quality. Text and vector
// graphics are left untouched, so this preserves selectable text and crisp
// typography — unlike full-page rasterization.
//
// Two encodings are handled, covering the vast majority of PDFs:
//   - /DCTDecode  (JPEG already): decode via createImageBitmap → re-encode
//   - /FlateDecode (PNG-style raw samples): inflate → optionally apply PNG
//     predictor reconstruction → encode as JPEG, switching the filter to
//     /DCTDecode in the dict
//
// Skipped (left untouched, never broken):
//   - Images with /SMask, /Mask, /ImageMask (JPEG can't carry alpha)
//   - FlateDecode images that aren't 8-bit DeviceRGB / DeviceGray
//   - FlateDecode images with TIFF predictor (predictor=2)
//   - Filter chains / unsupported filters (JPX, CCITT, etc.)
//   - Tiny (<4 KB) images where recompression overhead beats savings
//   - Cases where the recompressed JPEG isn't smaller than the source
export interface PdfImageCompressionResult {
  bytes: Uint8Array;
  imagesProcessed: number;
  imagesReplaced: number;
  bytesSaved: number;
}

const filterIsExactly = (filter: PDFObject | undefined, name: string): boolean => {
  if (filter instanceof PDFName) return filter.asString() === name;
  if (filter instanceof PDFArray) {
    const arr = filter.asArray();
    return (
      arr.length === 1 &&
      arr[0] instanceof PDFName &&
      (arr[0] as PDFName).asString() === name
    );
  }
  return false;
};

// Determine the number of color channels for an image's /ColorSpace value.
// Handles single PDFNames, indirect refs, and the ICCBased / CalGray / CalRGB
// array forms that are common in PDFs from word processors and scanners.
// Returns null for color spaces we can't safely round-trip (Indexed, DeviceN,
// Separation, DeviceCMYK, Lab).
const colorspaceChannels = (cs: PDFObject | undefined, context: PDFContext): 1 | 3 | null => {
  let resolved: PDFObject | undefined = cs;
  if (resolved instanceof PDFRef) {
    resolved = context.lookup(resolved);
  }
  if (resolved instanceof PDFName) {
    const n = resolved.asString();
    if (n === '/DeviceGray' || n === '/G' || n === '/CalGray') return 1;
    if (n === '/DeviceRGB' || n === '/RGB' || n === '/CalRGB') return 3;
    return null;
  }
  if (resolved instanceof PDFArray) {
    const arr = resolved.asArray();
    if (arr.length === 0 || !(arr[0] instanceof PDFName)) return null;
    const head = (arr[0] as PDFName).asString();
    if (head === '/CalGray') return 1;
    if (head === '/CalRGB') return 3;
    if (head === '/ICCBased' && arr.length >= 2) {
      // The ICC profile lives in a stream whose dict carries /N (component count).
      let iccObj: PDFObject | undefined = arr[1];
      if (iccObj instanceof PDFRef) iccObj = context.lookup(iccObj);
      if (iccObj instanceof PDFRawStream) {
        const n = iccObj.dict.get(PDFName.of('N'));
        if (n instanceof PDFNumber) {
          const c = n.asNumber();
          if (c === 1) return 1;
          if (c === 3) return 3;
        }
      }
    }
  }
  return null;
};

const inflateZlib = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const stream = new Blob([bytes.slice()]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const deflateZlib = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const stream = new Blob([bytes.slice()]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

// Apply PNG "up" predictor (PDF /DecodeParms /Predictor 12). Each output row
// holds (cur - above) per byte, prefixed by a filter-type marker (2 = Up).
// The decoded result is a much more compressible stream for typical document
// imagery because consecutive rows are highly correlated.
const applyPngUpPredictor = (
  raw: Uint8Array,
  width: number,
  height: number,
  bytesPerPixel: number
): Uint8Array => {
  const stride = width * bytesPerPixel;
  const out = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    out[rowStart] = 2; // PNG filter type 2 = Up
    const srcRow = y * stride;
    const prevRow = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const cur = raw[srcRow + x];
      const above = y > 0 ? raw[prevRow + x] : 0;
      out[rowStart + 1 + x] = (cur - above) & 0xff;
    }
  }
  return out;
};

// Reconstruct PNG-predicted pixel rows. Each row is prefixed by a single byte
// identifying its filter (None/Sub/Up/Average/Paeth) per PNG spec; PDF reuses
// the exact same encoding when /DecodeParms /Predictor is 10..15.
const reconstructPngPredictor = (
  filtered: Uint8Array,
  width: number,
  height: number,
  bytesPerPixel: number
): Uint8Array | null => {
  const stride = width * bytesPerPixel;
  const rowSize = stride + 1;
  if (filtered.length < rowSize * height) return null;
  const out = new Uint8Array(stride * height);

  for (let y = 0; y < height; y++) {
    const filterType = filtered[y * rowSize];
    const filteredRow = filtered.subarray(y * rowSize + 1, y * rowSize + 1 + stride);
    const outRowStart = y * stride;
    const prevRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const a = x >= bytesPerPixel ? out[outRowStart + x - bytesPerPixel] : 0;
      const b = y > 0 ? out[prevRowStart + x] : 0;
      const c = x >= bytesPerPixel && y > 0 ? out[prevRowStart + x - bytesPerPixel] : 0;
      const f = filteredRow[x];
      let recon: number;
      switch (filterType) {
        case 0: recon = f; break;
        case 1: recon = f + a; break;
        case 2: recon = f + b; break;
        case 3: recon = f + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          recon = f + pred;
          break;
        }
        default: return null;
      }
      out[outRowStart + x] = recon & 0xff;
    }
  }
  return out;
};

const flateImageToImageData = async (
  rawDeflated: Uint8Array,
  width: number,
  height: number,
  channels: 1 | 3,
  predictor: number
): Promise<ImageData | null> => {
  let raw: Uint8Array;
  try {
    raw = await inflateZlib(rawDeflated);
  } catch {
    return null;
  }

  if (predictor >= 10 && predictor <= 15) {
    const reconstructed = reconstructPngPredictor(raw, width, height, channels);
    if (!reconstructed) return null;
    raw = reconstructed;
  } else if (predictor !== 1) {
    return null;
  }

  if (raw.length < width * height * channels) return null;

  const imageData = new ImageData(width, height);
  if (channels === 3) {
    let src = 0;
    for (let i = 0; i < width * height; i++) {
      const dst = i * 4;
      imageData.data[dst] = raw[src++];
      imageData.data[dst + 1] = raw[src++];
      imageData.data[dst + 2] = raw[src++];
      imageData.data[dst + 3] = 255;
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      const dst = i * 4;
      const g = raw[i];
      imageData.data[dst] = g;
      imageData.data[dst + 1] = g;
      imageData.data[dst + 2] = g;
      imageData.data[dst + 3] = 255;
    }
  }
  return imageData;
};

const renderToJpegBytes = async (
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  width: number,
  height: number,
  quality01: number
): Promise<Uint8Array | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  paint(ctx, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  return encodeImageDataAsJpeg(imageData, quality01);
};

// Map the slider value (10..100) to encoder parameters, differentiated by
// what the source's original encoding tells us about its content:
//
//   - Lossy origin (/DCTDecode = JPEG). Almost always photographic content
//     — the source is already a lossy JPEG, so it tolerates further lossy
//     compression. Text is rare here.
//
//   - Lossless origin (/FlateDecode = PNG-style raw samples). This is where
//     word-processor exports stash rasterized headers, decorative type,
//     scanned diagrams, and screenshots. JPEG quantization destroys the
//     thin horizontal strokes in CJK title type well before it actually
//     shrinks the file, so the quality floor is much higher here and we
//     lean on resolution downscaling for the real size reduction.
const sliderToImageParams = (sliderValue: number, isLossyOrigin: boolean) => {
  const v = Math.max(10, Math.min(100, sliderValue));
  const t = v / 100;
  if (isLossyOrigin) {
    return {
      jpegQuality: 0.5 + t * 0.5, // q=10 → 0.55, q=100 → 1.00
      scale: 0.4 + t * 0.6,       // q=10 → 0.46, q=100 → 1.00
    };
  }
  // Flate sources: scale a bit more aggressively (more headroom for the
  // lossless Flate-to-Flate path to actually shrink), and use moderate JPEG
  // quality for the fallback path when Flate-to-Flate can't beat the source
  // (typical for photographic content saved as Flate).
  return {
    jpegQuality: 0.55 + t * 0.4, // q=10 → 0.59, q=100 → 0.95
    scale: 0.5 + t * 0.5,         // q=10 → 0.55, q=100 → 1.00
  };
};

// Skip resolution scaling for already-small images — sub-256px artwork
// (icons, button-like UI) becomes blurry beyond recognition when scaled.
const SCALE_MIN_LONG_EDGE = 256;

const computeTargetSize = (width: number, height: number, scale: number) => {
  const longest = Math.max(width, height);
  if (longest <= SCALE_MIN_LONG_EDGE || scale >= 0.99) {
    return { tw: width, th: height, scaled: false };
  }
  return {
    tw: Math.max(64, Math.round(width * scale)),
    th: Math.max(64, Math.round(height * scale)),
    scaled: true,
  };
};

// === Byte-level helpers for surgical PDF editing ===
//
// The previous implementation routed everything through pdf-lib's `doc.save()`,
// which silently corrupts certain embedded CJK font subsets on serialization.
// The functions below let us rebuild a PDF without ever asking pdf-lib to
// re-serialize anything except the image streams we're explicitly replacing.
// Every other indirect object is copied byte-for-byte from the source file.

const indexOfBytes = (haystack: Uint8Array, needle: Uint8Array, fromPos: number): number => {
  outer: for (let i = fromPos; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
};

const isWhitespaceByte = (b: number): boolean =>
  b === 0x20 || b === 0x09 || b === 0x0a || b === 0x0d || b === 0x0c;

// Pre-scan the byte buffer to find every (stream … endstream) range. The
// object-header scanner consults this so it doesn't false-match on binary
// stream content that happens to contain "<digits> <digits> obj"-like bytes.
const computeStreamRanges = (bytes: Uint8Array): Array<[number, number]> => {
  const ranges: Array<[number, number]> = [];
  const streamKw = new TextEncoder().encode('stream');
  const endstreamKw = new TextEncoder().encode('endstream');
  let pos = 0;
  while (pos < bytes.length) {
    const idx = indexOfBytes(bytes, streamKw, pos);
    if (idx === -1) break;
    // Discard 'endstream' false-match
    if (idx >= 3 && bytes[idx - 3] === 0x65 && bytes[idx - 2] === 0x6e && bytes[idx - 1] === 0x64) {
      pos = idx + streamKw.length;
      continue;
    }
    if (idx > 0 && !isWhitespaceByte(bytes[idx - 1])) {
      pos = idx + 1;
      continue;
    }
    let contentStart = idx + streamKw.length;
    if (bytes[contentStart] === 0x0d && bytes[contentStart + 1] === 0x0a) contentStart += 2;
    else if (bytes[contentStart] === 0x0a) contentStart += 1;
    else {
      pos = idx + streamKw.length;
      continue;
    }
    const endIdx = indexOfBytes(bytes, endstreamKw, contentStart);
    if (endIdx === -1) break;
    ranges.push([contentStart, endIdx]);
    pos = endIdx + endstreamKw.length;
  }
  return ranges;
};

const isInsideStream = (idx: number, ranges: Array<[number, number]>): boolean => {
  for (const [s, e] of ranges) {
    if (idx < s) return false;
    if (idx < e) return true;
  }
  return false;
};

interface IndirectObjectExtent {
  objNum: number;
  gen: number;
  headerStart: number;
  objEnd: number; // exclusive, just past 'endobj'
}

const findAllIndirectObjectExtents = (
  bytes: Uint8Array,
  streamRanges: Array<[number, number]>
): IndirectObjectExtent[] => {
  const results: IndirectObjectExtent[] = [];
  const endobjKw = new TextEncoder().encode('endobj');
  const decoder = new TextDecoder('latin1');
  let pos = 0;

  while (pos < bytes.length) {
    if (isInsideStream(pos, streamRanges)) {
      const r = streamRanges.find(([s, e]) => pos >= s && pos < e)!;
      pos = r[1];
      continue;
    }
    if (bytes[pos] < 0x30 || bytes[pos] > 0x39) { pos++; continue; }
    if (pos > 0 && !isWhitespaceByte(bytes[pos - 1])) { pos++; continue; }

    let p = pos;
    while (p < bytes.length && bytes[p] >= 0x30 && bytes[p] <= 0x39) p++;
    if (p === pos || p >= bytes.length || bytes[p] !== 0x20) { pos = p + 1; continue; }
    const objNumStr = decoder.decode(bytes.slice(pos, p));
    p++;
    const genStart = p;
    while (p < bytes.length && bytes[p] >= 0x30 && bytes[p] <= 0x39) p++;
    if (p === genStart) { pos = p + 1; continue; }
    const genStr = decoder.decode(bytes.slice(genStart, p));
    if (
      p + 4 > bytes.length ||
      bytes[p] !== 0x20 ||
      bytes[p + 1] !== 0x6f ||
      bytes[p + 2] !== 0x62 ||
      bytes[p + 3] !== 0x6a
    ) { pos = p + 1; continue; }
    if (p + 4 < bytes.length && !isWhitespaceByte(bytes[p + 4])) { pos = p + 4; continue; }

    const headerStart = pos;
    const afterObj = p + 4;

    let endSearch = afterObj;
    let endobjPos = -1;
    while (endSearch < bytes.length) {
      const idx = indexOfBytes(bytes, endobjKw, endSearch);
      if (idx === -1) break;
      if (isInsideStream(idx, streamRanges)) {
        endSearch = idx + endobjKw.length;
        continue;
      }
      if (idx > 0 && !isWhitespaceByte(bytes[idx - 1])) {
        endSearch = idx + 1;
        continue;
      }
      endobjPos = idx + endobjKw.length;
      break;
    }
    if (endobjPos === -1) break;

    results.push({
      objNum: parseInt(objNumStr, 10),
      gen: parseInt(genStr, 10),
      headerStart,
      objEnd: endobjPos,
    });
    pos = endobjPos;
  }
  return results;
};

const serializeIndirectStream = (
  ref: PDFRef,
  stream: PDFRawStream
): Uint8Array => {
  const header = new TextEncoder().encode(`${ref.objectNumber} ${ref.generationNumber} obj\n`);
  const footer = new TextEncoder().encode('\nendobj');
  const streamSize = stream.sizeInBytes();
  const buf = new Uint8Array(header.length + streamSize + footer.length);
  let off = 0;
  buf.set(header, off);
  off += header.length;
  off += stream.copyBytesInto(buf, off);
  buf.set(footer, off);
  return buf;
};

const findStartxrefOffset = (bytes: Uint8Array): number => {
  const tailLen = Math.min(2048, bytes.length);
  const tail = bytes.subarray(bytes.length - tailLen);
  const text = new TextDecoder('latin1').decode(tail);
  const matches = [...text.matchAll(/startxref\s+(\d+)/g)];
  if (matches.length === 0) throw new Error('PDF has no startxref');
  return parseInt(matches[matches.length - 1][1], 10);
};

interface ObjectStreamMember {
  objNum: number;
  index: number;
}

// Parse the header of an /ObjStm to learn which compressed object numbers it
// contains and at what index. We don't need each member's bytes — the parent
// /ObjStm is copied verbatim, so the members travel along with it.
const parseObjectStreamMembers = async (
  originalBytes: Uint8Array,
  extent: IndirectObjectExtent,
  dict: PDFDict
): Promise<ObjectStreamMember[]> => {
  const nObj = dict.get(PDFName.of('N'));
  const firstObj = dict.get(PDFName.of('First'));
  if (!(nObj instanceof PDFNumber) || !(firstObj instanceof PDFNumber)) return [];
  const n = nObj.asNumber();
  const first = firstObj.asNumber();
  if (n <= 0) return [];

  const streamKw = new TextEncoder().encode('stream');
  const endstreamKw = new TextEncoder().encode('endstream');
  const streamPos = indexOfBytes(originalBytes, streamKw, extent.headerStart);
  if (streamPos === -1 || streamPos > extent.objEnd) return [];
  let contentStart = streamPos + streamKw.length;
  if (originalBytes[contentStart] === 0x0d && originalBytes[contentStart + 1] === 0x0a) contentStart += 2;
  else if (originalBytes[contentStart] === 0x0a) contentStart += 1;
  const endPos = indexOfBytes(originalBytes, endstreamKw, contentStart);
  if (endPos === -1) return [];

  let streamData: Uint8Array = originalBytes.subarray(contentStart, endPos);
  const filter = dict.get(PDFName.of('Filter'));
  if (filter instanceof PDFName && filter.asString() === '/FlateDecode') {
    try {
      streamData = await inflateZlib(streamData);
    } catch {
      return [];
    }
  }

  const headerText = new TextDecoder('latin1').decode(streamData.subarray(0, first));
  const tokens = headerText.split(/\s+/).filter(x => x !== '');
  if (tokens.length < 2 * n) return [];

  const members: ObjectStreamMember[] = [];
  for (let i = 0; i < n; i++) {
    const objNum = parseInt(tokens[i * 2], 10);
    if (Number.isNaN(objNum)) continue;
    members.push({ objNum, index: i });
  }
  return members;
};

const serializePdfObjectAsText = (obj: PDFObject | undefined): string | null => {
  if (!obj) return null;
  const size = obj.sizeInBytes();
  const buf = new Uint8Array(size);
  obj.copyBytesInto(buf, 0);
  return new TextDecoder('latin1').decode(buf);
};

interface XrefEntry {
  type: 0 | 1 | 2;
  field2: number;
  field3: number;
}

const buildXrefStreamObject = (
  xrefObjNum: number,
  size: number,
  entries: XrefEntry[],
  trailerInfo: { Root?: PDFObject; Info?: PDFObject; ID?: PDFObject }
): Uint8Array => {
  // Fixed widths [type, field2, field3] = [1, 4, 2]. 4 bytes for field2 covers
  // up to 4 GB offsets and parent-objstm numbers; 2 bytes for field3 covers
  // generations 0..65535 and indices 0..65535. Sufficient for real-world PDFs.
  const W = [1, 4, 2];
  const entryWidth = W[0] + W[1] + W[2];

  const streamContent = new Uint8Array(entries.length * entryWidth);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const off = i * entryWidth;
    streamContent[off] = e.type;
    streamContent[off + 1] = (e.field2 >>> 24) & 0xff;
    streamContent[off + 2] = (e.field2 >>> 16) & 0xff;
    streamContent[off + 3] = (e.field2 >>> 8) & 0xff;
    streamContent[off + 4] = e.field2 & 0xff;
    streamContent[off + 5] = (e.field3 >>> 8) & 0xff;
    streamContent[off + 6] = e.field3 & 0xff;
  }

  let dictText = '<<';
  dictText += ' /Type /XRef';
  dictText += ` /Size ${size}`;
  dictText += ` /W [ ${W[0]} ${W[1]} ${W[2]} ]`;
  dictText += ` /Length ${streamContent.length}`;
  const rootStr = serializePdfObjectAsText(trailerInfo.Root);
  if (rootStr) dictText += ` /Root ${rootStr}`;
  const infoStr = serializePdfObjectAsText(trailerInfo.Info);
  if (infoStr) dictText += ` /Info ${infoStr}`;
  const idStr = serializePdfObjectAsText(trailerInfo.ID);
  if (idStr) dictText += ` /ID ${idStr}`;
  dictText += ' >>';

  const header = new TextEncoder().encode(`${xrefObjNum} 0 obj\n`);
  const dictBytes = new TextEncoder().encode(dictText);
  const streamHeader = new TextEncoder().encode('\nstream\n');
  const streamFooter = new TextEncoder().encode('\nendstream\nendobj');

  const total =
    header.length + dictBytes.length + streamHeader.length + streamContent.length + streamFooter.length;
  const result = new Uint8Array(total);
  let off = 0;
  result.set(header, off); off += header.length;
  result.set(dictBytes, off); off += dictBytes.length;
  result.set(streamHeader, off); off += streamHeader.length;
  result.set(streamContent, off); off += streamContent.length;
  result.set(streamFooter, off);
  return result;
};

// Dev-only diagnostic logger — Next.js inlines `process.env.NODE_ENV`
// at build time so production bundles end up with `false &&`-guarded calls
// that the minifier removes entirely.
const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

export const compressPdfImagesOnly = async (
  pdfBytes: ArrayBuffer,
  options: { quality: number }
): Promise<PdfImageCompressionResult> => {
  // Take an independent snapshot of the source bytes BEFORE pdf-lib touches
  // them. pdf-lib's loader may decompress some streams in place during parse,
  // which would silently invalidate any view backed by the same ArrayBuffer.
  // We then hand pdf-lib a SEPARATE copy so the snapshot stays pristine for
  // our verbatim byte copies later on.
  const originalBytes = new Uint8Array(pdfBytes).slice();
  const doc = await PDFDocument.load(new Uint8Array(pdfBytes).slice());
  const context = doc.context;

  // 1. Locate every free-standing top-level object in the original bytes.
  const streamRanges = computeStreamRanges(originalBytes);
  const extents = findAllIndirectObjectExtents(originalBytes, streamRanges);
  const extentByObjNum = new Map<number, IndirectObjectExtent>();
  for (const e of extents) extentByObjNum.set(e.objNum, e);

  // 2. Walk pdf-lib's parsed objects and compute the replacement bytes for
  //    every image we want to compress. The doc itself is never mutated.
  let imagesProcessed = 0;
  let bytesSaved = 0;
  const replacements = new Map<number, Uint8Array>(); // objNum → serialized replacement
  const skipReasons: Record<string, number> = {};
  const noteSkip = (reason: string) => {
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
  };

  debugLog('[pdfCompress] free-standing object count:', extents.length);

  let imageCandidatesSeen = 0;

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    if (!extentByObjNum.has(ref.objectNumber)) continue; // compressed; can't surgically replace

    const dict = obj.dict;
    const subtype = dict.get(PDFName.of('Subtype'));
    if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') continue;

    imageCandidatesSeen++;

    if (dict.get(PDFName.of('SMask'))) { noteSkip('has-SMask'); continue; }
    if (dict.get(PDFName.of('Mask'))) { noteSkip('has-Mask'); continue; }
    if (dict.get(PDFName.of('ImageMask'))) { noteSkip('is-ImageMask'); continue; }

    const filter = dict.get(PDFName.of('Filter'));
    const isJpeg = filterIsExactly(filter, '/DCTDecode');
    const isFlate = filterIsExactly(filter, '/FlateDecode');
    if (!isJpeg && !isFlate) {
      const filterDesc =
        filter instanceof PDFName ? filter.asString()
          : filter instanceof PDFArray
            ? '[' + filter.asArray().map(x => (x instanceof PDFName ? x.asString() : '?')).join(' ') + ']'
            : '?';
      noteSkip(`unsupported-filter:${filterDesc}`);
      continue;
    }

    imagesProcessed++;

    const oldBytes = obj.contents;
    if (oldBytes.byteLength < 4096) { noteSkip('too-small'); continue; }

    const { jpegQuality, scale } = sliderToImageParams(options.quality, isJpeg);

    let newImageBytes: Uint8Array | null = null;
    let newWidth = 0;
    let newHeight = 0;
    let flateChannels: 1 | 3 | null = null;

    try {
      if (isJpeg) {
        const blob = new Blob([oldBytes.slice()], { type: 'image/jpeg' });
        const bitmap = await createImageBitmap(blob);
        const { tw, th } = computeTargetSize(bitmap.width, bitmap.height, scale);
        newWidth = tw;
        newHeight = th;
        newImageBytes = await renderToJpegBytes(
          (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
          tw,
          th,
          jpegQuality
        );
        bitmap.close?.();
      } else if (isFlate) {
        // Resolve indirect refs while reading these fields — some PDFs store
        // them as indirect references rather than inline values.
        const widthObj = dict.lookup(PDFName.of('Width'));
        const heightObj = dict.lookup(PDFName.of('Height'));
        const bpcObj = dict.lookup(PDFName.of('BitsPerComponent'));
        if (!(widthObj instanceof PDFNumber) || !(heightObj instanceof PDFNumber)) {
          noteSkip('flate-bad-dimensions');
          continue;
        }
        if (!(bpcObj instanceof PDFNumber) || bpcObj.asNumber() !== 8) {
          noteSkip(`flate-bpc-${bpcObj instanceof PDFNumber ? bpcObj.asNumber() : 'missing'}`);
          continue;
        }

        const w = Math.round(widthObj.asNumber());
        const h = Math.round(heightObj.asNumber());
        flateChannels = colorspaceChannels(dict.get(PDFName.of('ColorSpace')), context);
        if (!flateChannels) {
          const csObj = dict.lookup(PDFName.of('ColorSpace'));
          const csDesc =
            csObj instanceof PDFName ? csObj.asString()
              : csObj instanceof PDFArray
                ? '[' + csObj.asArray().map(x => (x instanceof PDFName ? x.asString() : '?')).join(' ') + ']'
                : csObj === undefined ? 'missing' : csObj.constructor.name;
          noteSkip(`flate-unsupported-cs:${csDesc}`);
          continue;
        }

        let predictor = 1;
        const decodeParms = dict.lookup(PDFName.of('DecodeParms'));
        if (decodeParms instanceof PDFDict) {
          const p = decodeParms.lookup(PDFName.of('Predictor'));
          if (p instanceof PDFNumber) predictor = p.asNumber();
        }

        const imageData = await flateImageToImageData(oldBytes, w, h, flateChannels, predictor);
        if (!imageData) {
          noteSkip(`flate-decode-failed-predictor-${predictor}`);
          continue;
        }

        const { tw, th } = computeTargetSize(w, h, scale);
        newWidth = tw;
        newHeight = th;

        // Downscale the decoded pixels (canvas does the resampling for us).
        let finalImageData: ImageData;
        if (tw === w && th === h) {
          finalImageData = imageData;
        } else {
          const bitmap = await createImageBitmap(imageData);
          const canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            bitmap.close?.();
            continue;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, tw, th);
          bitmap.close?.();
          finalImageData = ctx.getImageData(0, 0, tw, th);
        }

        // Extract raw samples in the source's color space. We keep the same
        // colorspace (RGB or Gray) so the dict's /ColorSpace entry remains
        // valid and the file stays lossless apart from the resample.
        let rawSamples: Uint8Array;
        if (flateChannels === 3) {
          rawSamples = new Uint8Array(tw * th * 3);
          for (let i = 0; i < tw * th; i++) {
            rawSamples[i * 3] = finalImageData.data[i * 4];
            rawSamples[i * 3 + 1] = finalImageData.data[i * 4 + 1];
            rawSamples[i * 3 + 2] = finalImageData.data[i * 4 + 2];
          }
        } else {
          rawSamples = new Uint8Array(tw * th);
          for (let i = 0; i < tw * th; i++) {
            rawSamples[i] = finalImageData.data[i * 4];
          }
        }

        // Candidate A: Flate-to-Flate with PNG-up predictor. Preserves text
        // strokes exactly (lossless). This is the preferred path because
        // document images frequently contain rasterized type that JPEG
        // butchers.
        const filtered = applyPngUpPredictor(rawSamples, tw, th, flateChannels);
        const flateCandidate = await deflateZlib(filtered);

        if (flateCandidate.length < oldBytes.byteLength) {
          newImageBytes = flateCandidate;
        } else {
          // Candidate B (fallback): JPEG. Photographic content stored as
          // Flate compresses poorly with deflate even after downscaling —
          // JPEG handles it dramatically better, at the cost of some
          // text fidelity for any rasterized type in the image.
          let jpegCandidate: Uint8Array | null;
          if (tw === w && th === h) {
            jpegCandidate = await renderToJpegBytes(
              ctx => ctx.putImageData(finalImageData, 0, 0),
              tw,
              th,
              jpegQuality
            );
          } else {
            const bitmap = await createImageBitmap(finalImageData);
            jpegCandidate = await renderToJpegBytes(
              (ctx, dw, dh) => ctx.drawImage(bitmap, 0, 0, dw, dh),
              tw,
              th,
              jpegQuality
            );
            bitmap.close?.();
          }
          if (jpegCandidate && jpegCandidate.length < oldBytes.byteLength) {
            newImageBytes = jpegCandidate;
            // Mark this image for Flate→JPEG dict update (handled below).
            flateChannels = null; // signals JPEG path in dict-update logic
          }
        }
      }

      if (!newImageBytes) { noteSkip('no-newBytes'); continue; }
      if (newImageBytes.length >= oldBytes.byteLength) {
        noteSkip(`not-smaller(${isJpeg ? 'jpeg' : 'flate'}):${newImageBytes.length}>=${oldBytes.byteLength}`);
        continue;
      }
      debugLog(
        `[pdfCompress] replaced obj ${ref.objectNumber} (${isJpeg ? 'JPEG' : 'Flate'}): ` +
        `${oldBytes.byteLength} → ${newImageBytes.length} bytes`
      );

      // Build the replacement stream object. Three cases:
      //   - JPEG source, re-encoded as JPEG: filter unchanged.
      //   - Flate source, kept lossless Flate: add PNG-up /DecodeParms.
      //   - Flate source, fell back to JPEG (photographic content): switch
      //     /Filter to /DCTDecode, force /ColorSpace to /DeviceRGB, strip
      //     anything that no longer applies.
      const newDict = dict.clone(context);
      newDict.set(PDFName.of('Width'), PDFNumber.of(newWidth));
      newDict.set(PDFName.of('Height'), PDFNumber.of(newHeight));
      if (isJpeg) {
        if (newDict.has(PDFName.of('DecodeParms'))) newDict.delete(PDFName.of('DecodeParms'));
        if (newDict.has(PDFName.of('Decode'))) newDict.delete(PDFName.of('Decode'));
      } else if (isFlate && flateChannels) {
        const decodeParmsDict = PDFDict.withContext(context);
        decodeParmsDict.set(PDFName.of('Predictor'), PDFNumber.of(12));
        decodeParmsDict.set(PDFName.of('Columns'), PDFNumber.of(newWidth));
        decodeParmsDict.set(PDFName.of('Colors'), PDFNumber.of(flateChannels));
        decodeParmsDict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
        newDict.set(PDFName.of('DecodeParms'), decodeParmsDict);
      } else if (isFlate && !flateChannels) {
        // Flate → JPEG fallback: rewrite filter / colorspace metadata.
        newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        newDict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
        if (newDict.has(PDFName.of('DecodeParms'))) newDict.delete(PDFName.of('DecodeParms'));
        if (newDict.has(PDFName.of('Decode'))) newDict.delete(PDFName.of('Decode'));
      }

      const newStream = PDFRawStream.of(newDict, newImageBytes);
      replacements.set(ref.objectNumber, serializeIndirectStream(ref, newStream));
      bytesSaved += oldBytes.byteLength - newImageBytes.length;
    } catch (err) {
      console.error('Failed to recompress PDF image:', err);
    }
  }

  debugLog('[pdfCompress] summary:', {
    freeStanding: extents.length,
    imageCandidates: imageCandidatesSeen,
    eligible: imagesProcessed,
    replaced: replacements.size,
    bytesSaved,
    skipReasons,
  });

  if (replacements.size === 0) {
    return { bytes: originalBytes, imagesProcessed, imagesReplaced: 0, bytesSaved: 0 };
  }

  // 3. Identify whether the source uses an xref stream and, if so, which
  //    indirect object holds it (so we can skip it when copying).
  const startxrefOffset = findStartxrefOffset(originalBytes);
  let originalXrefObjNum = -1;
  for (const e of extents) {
    if (e.headerStart === startxrefOffset) {
      originalXrefObjNum = e.objNum;
      break;
    }
  }

  // 4. Discover compressed (inside /ObjStm) objects so our new xref can map
  //    them with type-2 entries. The parent /ObjStm is copied verbatim, so we
  //    only need to know each member's index within its parent.
  const compressedRefs = new Map<number, { parentObjNum: number; index: number }>();
  for (const e of extents) {
    if (e.objNum === originalXrefObjNum) continue;
    const lookedUp = context.lookup(PDFRef.of(e.objNum, e.gen));
    if (!(lookedUp instanceof PDFRawStream)) continue;
    const type = lookedUp.dict.get(PDFName.of('Type'));
    if (!(type instanceof PDFName) || type.asString() !== '/ObjStm') continue;
    const members = await parseObjectStreamMembers(originalBytes, e, lookedUp.dict);
    for (const m of members) {
      compressedRefs.set(m.objNum, { parentObjNum: e.objNum, index: m.index });
    }
  }

  // 5. Build the output: header + (each top-level object, either replaced or
  //    copied verbatim) + new xref stream + startxref + %%EOF.
  const chunks: Uint8Array[] = [];
  const newOffsets = new Map<number, number>();
  let cursor = 0;

  const sortedExtents = extents.slice().sort((a, b) => a.headerStart - b.headerStart);
  const firstObjStart = sortedExtents[0]?.headerStart ?? 0;
  chunks.push(originalBytes.subarray(0, firstObjStart));
  cursor = firstObjStart;

  for (const e of sortedExtents) {
    if (e.objNum === originalXrefObjNum) continue;
    newOffsets.set(e.objNum, cursor);
    const replacement = replacements.get(e.objNum);
    if (replacement) {
      chunks.push(replacement);
      cursor += replacement.length;
    } else {
      const verbatim = originalBytes.subarray(e.headerStart, e.objEnd);
      chunks.push(verbatim);
      cursor += verbatim.length;
    }
    chunks.push(new Uint8Array([0x0a]));
    cursor += 1;
  }

  // 6. Build new xref stream entries.
  let maxObjNum = 0;
  for (const e of extents) if (e.objNum > maxObjNum) maxObjNum = e.objNum;
  for (const k of compressedRefs.keys()) if (k > maxObjNum) maxObjNum = k;

  const xrefObjNum = maxObjNum + 1;
  const newSize = xrefObjNum + 1;

  const entries: XrefEntry[] = [];
  for (let i = 0; i < newSize; i++) {
    entries.push({ type: 0, field2: 0, field3: 65535 });
  }
  for (const [objNum, offset] of newOffsets) {
    const gen = extentByObjNum.get(objNum)?.gen ?? 0;
    entries[objNum] = { type: 1, field2: offset, field3: gen };
  }
  for (const [objNum, info] of compressedRefs) {
    entries[objNum] = { type: 2, field2: info.parentObjNum, field3: info.index };
  }

  const xrefStreamOffset = cursor;
  entries[xrefObjNum] = { type: 1, field2: xrefStreamOffset, field3: 0 };

  const xrefStreamBytes = buildXrefStreamObject(xrefObjNum, newSize, entries, context.trailerInfo);
  chunks.push(xrefStreamBytes);
  cursor += xrefStreamBytes.length;

  const tail = new TextEncoder().encode(`\nstartxref\n${xrefStreamOffset}\n%%EOF\n`);
  chunks.push(tail);

  // 7. Concatenate.
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const output = new Uint8Array(totalLength);
  let off = 0;
  for (const c of chunks) {
    output.set(c, off);
    off += c.length;
  }

  return {
    bytes: output,
    imagesProcessed,
    imagesReplaced: replacements.size,
    bytesSaved,
  };
};

export const extractPdfPages = async (file: File) => {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) return [];
  
  // Use a fresh ArrayBuffer for PDF.js processing
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  
  const pages = [];
  const pdfGroupId = `pdf-${Date.now()}-${Math.random()}`;
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Generate thumbnail for this page
    const thumbnailUrl = await generatePageThumbnail(pdf, pageNum);
    
    pages.push({
      id: `${Date.now()}-${Math.random()}-page-${pageNum}`,
      name: `Page ${pageNum}/${numPages}`,
      type: file.type,
      url: thumbnailUrl || URL.createObjectURL(file), // Use thumbnail or fallback to blob URL
      blob: file, // Store the original blob for generating fresh ArrayBuffers
      arrayBuffer: undefined, // Don't store ArrayBuffer, generate fresh ones when needed
      pageNumber: pageNum,
      totalPages: numPages,
      pdfGroupId: pdfGroupId,
      originalFileName: file.name,
      thumbnailUrl: thumbnailUrl, // Store thumbnail URL separately
    });
  }

  return pages;
};

// Render each item in the file list as an image and pack everything into a
// single ZIP for download. PDF inputs are rendered page-by-page via pdf.js
// at the requested DPI; image inputs are rasterized through canvas so the
// final ZIP is uniform (same format, same density signal where applicable).
export interface ImageExportFile {
  name: string;
  type: string;
  blob?: Blob;
  arrayBuffer?: ArrayBuffer;
  url?: string;
  pageNumber?: number;
  originalFileName?: string;
}

export const exportFilesAsImageZip = async (
  files: ImageExportFile[],
  options: { format: 'png' | 'jpg'; dpi: number }
): Promise<Blob> => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const mime = options.format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = options.format === 'png' ? 'png' : 'jpg';
  // JPEG quality stays high since the slider already controls effective
  // resolution via DPI — pushing quality lower would compound losses.
  const jpegQuality = 0.92;
  const scale = options.dpi / 72;

  const renderCanvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
    new Promise(resolve => canvas.toBlob(resolve, mime, jpegQuality));

  // Track allocated entry names so identical sources don't silently overwrite
  // each other in the archive (rare, but possible when a user duplicates the
  // same image or rearranges the same PDF page in twice).
  const usedNames = new Set<string>();
  const uniqueName = (base: string): string => {
    let candidate = `${base}.${ext}`;
    let counter = 2;
    while (usedNames.has(candidate)) {
      candidate = `${base}-${counter}.${ext}`;
      counter++;
    }
    usedNames.add(candidate);
    return candidate;
  };

  for (const file of files) {
    try {
      if (file.type === 'application/pdf' && file.blob && file.pageNumber !== undefined) {
        const pdfjsLib = await loadPdfJs();
        if (!pdfjsLib) continue;
        const pdfBytes = await file.blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const page = await pdf.getPage(file.pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        // White background so transparent PDF pages don't render as black
        // under JPEG, which has no alpha channel.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport, intent: 'print' }).promise;

        const blob = await renderCanvasToBlob(canvas);
        if (!blob) continue;
        const buffer = await blob.arrayBuffer();
        const base = file.originalFileName
          ? file.originalFileName.replace(/\.pdf$/i, '')
          : 'document';
        const filename = uniqueName(`${base}_p${String(file.pageNumber).padStart(3, '0')}`);
        zip.file(filename, buffer);
      } else if (file.type.startsWith('image/')) {
        // Image input: decode → re-encode in the requested format. We don't
        // upscale; DPI affects only PDF page rendering.
        let imageBytes: ArrayBuffer | null = null;
        if (file.arrayBuffer) {
          imageBytes = file.arrayBuffer;
        } else if (file.blob) {
          imageBytes = await file.blob.arrayBuffer();
        } else if (file.url) {
          const res = await fetch(file.url);
          if (res.ok) imageBytes = await res.arrayBuffer();
        }
        if (!imageBytes) continue;
        const bitmap = await createImageBitmap(new Blob([imageBytes.slice(0)], { type: file.type }));
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          bitmap.close?.();
          continue;
        }
        if (options.format === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close?.();
        const blob = await renderCanvasToBlob(canvas);
        if (!blob) continue;
        const buffer = await blob.arrayBuffer();
        const base = file.name.replace(/\.[^.]+$/, '') || 'image';
        const filename = uniqueName(base);
        zip.file(filename, buffer);
      }
    } catch (err) {
      console.error('Failed to export file as image:', file.name, err);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
};