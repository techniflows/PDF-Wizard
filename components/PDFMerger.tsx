'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { downloadBlob, downloadFilesOrZip, type NamedBlob } from '@/utils/download';
import { format, formatCount } from '@/utils/i18n';
import {
  renderPdfPageToImage,
  compressImage,
  compressPdfPage,
  withPdfDocuments,
  type CompressionLevel,
} from '@/utils/pdfUtils';
import CompressModal from './CompressModal';
import FileUploader from './FileUploader';
import ImageExportModal, { type ImageExportSettings } from './ImageExportModal';
import { useTranslations } from './LanguageProvider';
import PDFSettingsModal, { type PDFSettings } from './PDFSettingsModal';
import { buttonPrimary, buttonSecondary, textButton } from './styles';

// The list pulls in dnd-kit, which nobody needs before the first file is added.
const FileList = dynamic(() => import('./FileList'), { ssr: false });

export interface FileData {
  id: string;
  name: string;
  type: string;
  url: string;
  blob?: Blob;
  arrayBuffer?: ArrayBuffer;
  pageNumber?: number;
  totalPages?: number;
  pdfGroupId?: string;
  originalFileName?: string;
  thumbnailUrl?: string;
  included: boolean;
}

type Dialog = 'settings' | 'image-export' | 'compress-image' | 'compress-pdf' | null;
type Job = 'pdf' | 'image-export' | 'compress' | null;

const MARGIN_POINTS = { none: 0, small: 36, big: 72 };
const A4_POINTS: [number, number] = [595.28, 841.89];

const isPdf = (file: FileData) => file.type === 'application/pdf';
const isImage = (file: FileData) => file.type.startsWith('image/');

function revokeBlobUrl(file: FileData) {
  if (file.url.startsWith('blob:')) {
    URL.revokeObjectURL(file.url);
  }
}

export default function PDFMerger() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogOpener, setDialogOpener] = useState<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [job, setJob] = useState<Job>(null);
  const t = useTranslations();

  const includedFiles = files.filter((file) => file.included);
  const includedPdfPages = includedFiles.filter(isPdf);
  const includedImages = includedFiles.filter(isImage);
  const noneIncluded = includedFiles.length === 0;
  // With everything set aside the buttons stay visible (disabled), so they follow the whole list.
  const actionFiles = noneIncluded ? files : includedFiles;
  const isBusy = job !== null;
  const closeDialog = () => setDialog(null);
  const openDialog = (next: Dialog) => (event: React.MouseEvent<HTMLElement>) => {
    setDialogOpener(event.currentTarget);
    setDialog(next);
  };

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => () => filesRef.current.forEach(revokeBlobUrl), []);

  const handleClearAll = () => {
    files.forEach(revokeBlobUrl);
    setFiles([]);
    // The button unmounts with the list, which would drop focus to <body>.
    fileInputRef.current?.focus();
  };

  const invertIncluded = () => {
    setFiles((items) => items.map((item) => ({ ...item, included: !item.included })));
  };

  const includeAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    // This button unmounts once nothing is excluded, so focus moves to a neighbour first.
    const neighbour = event.currentTarget.previousElementSibling ?? event.currentTarget.nextElementSibling;
    if (neighbour instanceof HTMLElement) neighbour.focus();
    setFiles((items) => items.map((item) => ({ ...item, included: true })));
  };

  const exportAsImages = async (settings: ImageExportSettings) => {
    const pdfFiles = includedPdfPages;
    if (pdfFiles.length === 0) return;

    setJob('image-export');
    try {
      const extension = settings.format === 'png' ? 'png' : 'jpg';
      const images: NamedBlob[] = [];

      await withPdfDocuments(async (open) => {
        for (let i = 0; i < pdfFiles.length; i++) {
          const file = pdfFiles[i];
          if (!file.blob || file.pageNumber === undefined) continue;

          const blob = await renderPdfPageToImage(await open(file.blob), file.pageNumber, settings);
          images.push({ name: `page-${String(i + 1).padStart(3, '0')}.${extension}`, blob });
        }
      });

      if (images.length === 0) {
        throw new Error('No images to export');
      }

      await downloadFilesOrZip(images, `pdf-images-${Date.now()}.zip`);
      closeDialog();
    } catch (error) {
      console.error('Error exporting images:', error);
      alert(t.imageExport.exportError);
    } finally {
      setJob(null);
    }
  };

  const compressImages = async (level: CompressionLevel) => {
    const imageFiles = includedImages;
    if (imageFiles.length === 0) return;

    const compressed: NamedBlob[] = [];
    for (const file of imageFiles) {
      let blob: Blob;
      if (file.blob) {
        blob = file.blob;
      } else if (file.arrayBuffer) {
        blob = new Blob([file.arrayBuffer], { type: file.type });
      } else {
        const response = await fetch(file.url);
        blob = await response.blob();
      }

      compressed.push({
        name: `${file.name.replace(/\.[^/.]+$/, '')}-compressed.jpg`,
        blob: await compressImage(blob, level),
      });
    }

    await downloadFilesOrZip(compressed, `compressed-images-${Date.now()}.zip`);
  };

  const compressPdf = async (level: CompressionLevel) => {
    const pdfFiles = includedPdfPages;
    if (pdfFiles.length === 0) return;

    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    await withPdfDocuments(async (open) => {
      for (const file of pdfFiles) {
        if (!file.blob || file.pageNumber === undefined) continue;

        const { blob, width, height } = await compressPdfPage(await open(file.blob), file.pageNumber, level);
        const image = await pdfDoc.embedJpg(await blob.arrayBuffer());

        // The page keeps its natural size in points so its physical size is
        // unchanged; the embedded JPEG carries the resolution.
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });
      }
    });

    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), `compressed-pdf-${Date.now()}.pdf`);
  };

  const compressFiles = async (compress: (level: CompressionLevel) => Promise<void>, level: CompressionLevel) => {
    setJob('compress');
    try {
      await compress(level);
      closeDialog();
    } catch (error) {
      console.error('Error compressing files:', error);
      alert(t.compress.compressError);
    } finally {
      setJob(null);
    }
  };

  const generatePDF = async (settings: PDFSettings) => {
    if (noneIncluded) return;

    setJob('pdf');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      // Every page of an upload shares one blob, so each source is parsed once.
      const sources = new Map<Blob, ReturnType<typeof PDFDocument.load>>();
      const loadSource = (blob: Blob) => {
        let source = sources.get(blob);
        if (!source) {
          source = blob.arrayBuffer().then((bytes) => PDFDocument.load(bytes));
          sources.set(blob, source);
        }
        return source;
      };

      for (const file of includedFiles) {
        try {
          if (isPdf(file)) {
            let existingPdf;

            if (file.blob) {
              existingPdf = await loadSource(file.blob);
            } else {
              const response = await fetch(file.url);
              if (!response.ok) throw new Error('Failed to fetch PDF');
              existingPdf = await PDFDocument.load(await response.arrayBuffer());
            }

            if (file.pageNumber !== undefined) {
              const [page] = await pdfDoc.copyPages(existingPdf, [file.pageNumber - 1]);
              pdfDoc.addPage(page);
            } else {
              const pages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
              pages.forEach(page => pdfDoc.addPage(page));
            }
          } else {
            let imageBytes: ArrayBuffer;

            if (file.arrayBuffer) {
              imageBytes = file.arrayBuffer;
            } else if (file.blob) {
              imageBytes = await file.blob.arrayBuffer();
            } else {
              const response = await fetch(file.url);
              if (!response.ok) throw new Error('Failed to fetch image');
              imageBytes = await response.arrayBuffer();
            }

            let image;

            try {
              if (file.type.includes('png')) {
                image = await pdfDoc.embedPng(imageBytes);
              } else {
                image = await pdfDoc.embedJpg(imageBytes);
              }
            } catch (embedError) {
              console.error(`Failed to embed ${file.name}, trying alternative format`, embedError);
              if (file.type.includes('png')) {
                image = await pdfDoc.embedJpg(imageBytes);
              } else {
                image = await pdfDoc.embedPng(imageBytes);
              }
            }

            const margin = MARGIN_POINTS[settings.margin];
            const page = settings.pageSize === 'a4'
              ? pdfDoc.addPage(A4_POINTS)
              : pdfDoc.addPage([image.width + (margin * 2), image.height + (margin * 2)]);

            const { width, height } = page.getSize();
            const availableWidth = width - (margin * 2);
            const availableHeight = height - (margin * 2);

            const scale = Math.min(availableWidth / image.width, availableHeight / image.height, 1);
            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;

            page.drawImage(image, {
              x: margin + (availableWidth - scaledWidth) / 2,
              y: margin + (availableHeight - scaledHeight) / 2,
              width: scaledWidth,
              height: scaledHeight,
            });
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          alert(format(t.errors.fileSkipped, { name: file.name }));
        }
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), `merged-pdf-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t.errors.generationFailed);
    } finally {
      setJob(null);
    }
  };

  const compressTarget = dialog === 'compress-pdf'
    ? { type: 'pdf' as const, count: includedPdfPages.length, run: compressPdf }
    : { type: 'image' as const, count: includedImages.length, run: compressImages };

  return (
    <div>
      <FileUploader inputRef={fileInputRef} onFilesAdded={(newFiles) => setFiles((prev) => [...prev, ...newFiles])} />

      {files.length > 0 && (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2">
            <p role="status" className="text-sm text-neutral-600 dark:text-neutral-400">
              {includedFiles.length === files.length
                ? formatCount(t.fileList.count, files.length)
                : format(t.fileList.countIncluded, { included: includedFiles.length, total: files.length })}
            </p>
            <div className="-mx-2 flex flex-wrap">
              {files.length >= 2 && (
                <button type="button" onClick={invertIncluded} className={textButton}>
                  {t.fileList.invert}
                </button>
              )}
              {includedFiles.length < files.length && (
                <button type="button" onClick={includeAll} className={textButton}>
                  {t.fileList.includeAll}
                </button>
              )}
              <button type="button" onClick={handleClearAll} className={textButton}>
                {t.fileList.clearAll}
              </button>
            </div>
          </div>

          <FileList files={files} setFiles={setFiles} />

          {/* Focusable so a closing dialog has somewhere to put focus while its opener is disabled. */}
          <div
            role="group"
            aria-label={t.buttons.groupLabel}
            tabIndex={-1}
            className="flex flex-col gap-2 outline-none sm:flex-row sm:flex-wrap"
          >
            <button
              type="button"
              onClick={openDialog('settings')}
              disabled={isBusy || noneIncluded}
              className={buttonPrimary}
            >
              {job === 'pdf' ? t.buttons.generating : t.buttons.downloadPdf}
            </button>
            {actionFiles.some(isPdf) && (
              <button
                type="button"
                onClick={openDialog('image-export')}
                disabled={isBusy || noneIncluded}
                className={buttonSecondary}
              >
                {t.buttons.downloadAsImages}
              </button>
            )}
            {actionFiles.some(isImage) && (
              <button
                type="button"
                onClick={openDialog('compress-image')}
                disabled={isBusy || noneIncluded}
                className={buttonSecondary}
              >
                {t.buttons.compressImages}
              </button>
            )}
            {actionFiles.some(isPdf) && (
              <button
                type="button"
                onClick={openDialog('compress-pdf')}
                disabled={isBusy || noneIncluded}
                className={buttonSecondary}
              >
                {t.buttons.compressPdf}
              </button>
            )}
          </div>
          {noneIncluded && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{t.buttons.noneIncluded}</p>
          )}
        </>
      )}

      <PDFSettingsModal
        isOpen={dialog === 'settings'}
        onClose={closeDialog}
        opener={dialogOpener}
        onConfirm={generatePDF}
      />

      <ImageExportModal
        isOpen={dialog === 'image-export'}
        onClose={closeDialog}
        opener={dialogOpener}
        onConfirm={exportAsImages}
        pageCount={includedPdfPages.length}
        isExporting={job === 'image-export'}
      />

      <CompressModal
        isOpen={dialog === 'compress-image' || dialog === 'compress-pdf'}
        onClose={closeDialog}
        opener={dialogOpener}
        onConfirm={(level) => compressFiles(compressTarget.run, level)}
        compressType={compressTarget.type}
        fileCount={compressTarget.count}
        isCompressing={job === 'compress'}
      />
    </div>
  );
}
