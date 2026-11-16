import { PDFDocument, type PDFPage } from 'pdf-lib';
import { compressPdfImages } from './pdfImageCompression';
import {
  compressPdfPage,
  getImageRecompression,
  withPdfDocuments,
  type CompressionLevel,
  type PdfCompressionMethod,
} from './pdfUtils';

export interface PdfPageSource {
  blob: Blob;
  pageNumber: number;
}

export interface CompressedPdf {
  bytes: Uint8Array;
  // Size of the same pages assembled without compression. Missing when
  // pdf-lib cannot read a source that pdf.js can still render.
  originalSize?: number;
}

export async function assemblePdfPages(pages: PdfPageSource[]): Promise<PDFDocument> {
  const assembled = await PDFDocument.create();

  const pageIndices = new Map<Blob, number[]>();
  for (const { blob, pageNumber } of pages) {
    pageIndices.set(blob, [...(pageIndices.get(blob) ?? []), pageNumber - 1]);
  }

  // pdf-lib shares copied objects only within one copyPages call, so each
  // source is copied in one call. An image or font used on several pages then
  // exists once in the assembled document.
  const copies = new Map<Blob, PDFPage[]>();
  for (const [blob, indices] of pageIndices) {
    const source = await PDFDocument.load(await blob.arrayBuffer());
    copies.set(blob, await assembled.copyPages(source, indices));
  }

  for (const { blob } of pages) {
    const page = copies.get(blob)?.shift();
    if (page) assembled.addPage(page);
  }
  return assembled;
}

async function flattenPages(pages: PdfPageSource[], level: CompressionLevel): Promise<CompressedPdf> {
  const pdfDoc = await PDFDocument.create();

  await withPdfDocuments(async (open) => {
    for (const { blob, pageNumber } of pages) {
      const page = await compressPdfPage(await open(blob), pageNumber, level);
      const image = await pdfDoc.embedJpg(await page.blob.arrayBuffer());

      // The page keeps its natural size in points so its physical size is
      // unchanged; the embedded JPEG carries the resolution.
      const { width, height } = page;
      pdfDoc.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    }
  });

  const original = await assemblePdfPages(pages).then(
    (assembled) => assembled.save(),
    () => undefined
  );
  return { bytes: await pdfDoc.save(), originalSize: original?.length };
}

const COMPRESSORS: Record<
  PdfCompressionMethod,
  (pages: PdfPageSource[], level: CompressionLevel) => Promise<CompressedPdf>
> = {
  'keep-text': async (pages, level) => compressPdfImages(await assemblePdfPages(pages), getImageRecompression(level)),
  flatten: flattenPages,
};

export const compressPdfPages = (
  pages: PdfPageSource[],
  level: CompressionLevel,
  method: PdfCompressionMethod
): Promise<CompressedPdf> => COMPRESSORS[method](pages, level);
