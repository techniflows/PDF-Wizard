import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { ImageRecompression } from './pdfImageCompression';

export const loadPdfJs = async () => {
  if (typeof window === 'undefined') return null;

  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  return pdfjsLib;
};

const loadPdfDocument = async (blob: Blob): Promise<PDFDocumentProxy> => {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) throw new Error('PDF.js failed to load');

  return pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
};

export type OpenPdf = (blob: Blob) => Promise<PDFDocumentProxy>;

// Each source blob is parsed once per job, and every document (with its
// worker) is released when the job ends, whether it finished or threw.
export async function withPdfDocuments<T>(job: (open: OpenPdf) => Promise<T>): Promise<T> {
  const documents = new Map<Blob, Promise<PDFDocumentProxy>>();
  const open: OpenPdf = (blob) => {
    let pdf = documents.get(blob);
    if (!pdf) {
      pdf = loadPdfDocument(blob);
      documents.set(blob, pdf);
    }
    return pdf;
  };

  try {
    return await job(open);
  } finally {
    await Promise.allSettled([...documents.values()].map(async (pdf) => (await pdf).destroy()));
  }
}

// iOS Safari refuses to allocate a canvas above this many pixels.
const MAX_CANVAS_PIXELS = 16_777_216;

export function fitCanvasSize(width: number, height: number): { width: number; height: number } {
  const shrink = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  return { width: Math.floor(width * shrink), height: Math.floor(height * shrink) };
}

const renderPage = async (page: PDFPageProxy, scale: number, background?: string): Promise<HTMLCanvasElement> => {
  let viewport = page.getViewport({ scale });
  const pixels = viewport.width * viewport.height;
  if (pixels > MAX_CANVAS_PIXELS) {
    viewport = page.getViewport({ scale: scale * Math.sqrt(MAX_CANVAS_PIXELS / pixels) });
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');
  // Rounding down keeps the product at or under the limit when the shrunk viewport lands a hair above it.
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
};

export const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode canvas'))), type, quality);
  });

const generatePageThumbnail = async (pdf: PDFDocumentProxy, pageNumber: number): Promise<string> => {
  try {
    const canvas = await renderPage(await pdf.getPage(pageNumber), 1.5);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return '';
  }
};

export const extractPdfPages = async (file: File) => {
  const pdf = await loadPdfDocument(file);

  try {
    const numPages = pdf.numPages;
    const pages = [];
    const pdfGroupId = `pdf-${Date.now()}-${Math.random()}`;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const thumbnailUrl = await generatePageThumbnail(pdf, pageNum);

      pages.push({
        id: `${Date.now()}-${Math.random()}-page-${pageNum}`,
        name: `Page ${pageNum}/${numPages}`,
        type: file.type,
        url: thumbnailUrl || URL.createObjectURL(file),
        blob: file,
        arrayBuffer: undefined,
        pageNumber: pageNum,
        totalPages: numPages,
        pdfGroupId: pdfGroupId,
        originalFileName: file.name,
        thumbnailUrl: thumbnailUrl,
        included: true,
      });
    }

    return pages;
  } finally {
    await pdf.destroy();
  }
};

const getScaleForQuality = (quality: 'low' | 'medium' | 'high'): number => {
  switch (quality) {
    case 'low': return 1; // 72 DPI base
    case 'medium': return 2; // ~150 DPI
    case 'high': return 4; // ~300 DPI
    default: return 2;
  }
};

export interface ImageExportOptions {
  format: 'png' | 'jpeg';
  quality: 'low' | 'medium' | 'high';
}

export const renderPdfPageToImage = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: ImageExportOptions
): Promise<Blob> => {
  const page = await pdf.getPage(pageNumber);
  // JPEG has no alpha channel, so transparent areas would otherwise render black.
  const canvas = await renderPage(page, getScaleForQuality(options.quality), options.format === 'jpeg' ? '#FFFFFF' : undefined);

  if (options.format === 'png') return canvasToBlob(canvas, 'image/png');

  const jpegQuality = options.quality === 'high' ? 0.95 : options.quality === 'medium' ? 0.85 : 0.7;
  return canvasToBlob(canvas, 'image/jpeg', jpegQuality);
};

export type CompressionLevel = 'low' | 'medium' | 'high';

const getCompressionQuality = (level: CompressionLevel): number => {
  switch (level) {
    case 'low': return 0.8;
    case 'medium': return 0.6;
    case 'high': return 0.4;
    default: return 0.6;
  }
};

const getCompressionScale = (level: CompressionLevel): number => {
  switch (level) {
    case 'low': return 1;
    case 'medium': return 0.75;
    case 'high': return 0.5;
    default: return 0.75;
  }
};

export type PdfCompressionMethod = 'keep-text' | 'flatten';

// Long-edge caps for images embedded in a PDF, in pixels. Every cap has to stay
// at or under 4096 so the canvas an image is redrawn on fits MAX_CANVAS_PIXELS.
const MAX_IMAGE_LONG_EDGE: Record<CompressionLevel, number> = {
  low: 3200,
  medium: 2500,
  high: 1800,
};

export const getImageRecompression = (level: CompressionLevel): ImageRecompression => ({
  jpegQuality: getCompressionQuality(level),
  maxLongEdge: MAX_IMAGE_LONG_EDGE[level],
});

export const compressImage = async (
  imageBlob: Blob,
  level: CompressionLevel
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = getCompressionScale(level);
      const quality = getCompressionQuality(level);

      const canvas = document.createElement('canvas');
      const size = { width: Math.round(img.width * scale), height: Math.round(img.height * scale) };
      Object.assign(canvas, size.width * size.height > MAX_CANVAS_PIXELS ? fitCanvasSize(size.width, size.height) : size);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

// Result of compressing a single PDF page: the JPEG image plus the page's
// natural size in PDF points (NOT pixels). The caller must build the new page
// with width/height so the page keeps its original physical size.
export interface CompressedPage {
  blob: Blob;
  width: number;
  height: number;
}

// Compress PDF by re-rendering pages as compressed images.
// The image is rendered at a higher pixel density for sharpness, but the page's
// natural point size is returned separately so the rebuilt page does not change
// physical dimensions (mixing pixel counts with points was bloating pages).
export const compressPdfPage = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  level: CompressionLevel
): Promise<CompressedPage> => {
  const page = await pdf.getPage(pageNumber);

  // Natural page size in PDF points (the physical page dimensions).
  const naturalViewport = page.getViewport({ scale: 1 });

  // Render at a higher pixel density (controlled by the compression level) for
  // image sharpness; this only affects the embedded JPEG's resolution, not the
  // page's point size.
  const canvas = await renderPage(page, getCompressionScale(level) * 2, '#FFFFFF');

  return {
    blob: await canvasToBlob(canvas, 'image/jpeg', getCompressionQuality(level)),
    width: naturalViewport.width,
    height: naturalViewport.height,
  };
};
