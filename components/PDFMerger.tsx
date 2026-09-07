'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PDFDocument } from 'pdf-lib';
import FileUploader from './FileUploader';
import FileItem from './FileItem';
import PDFSettingsModal, { PDFSettings } from './PDFSettingsModal';
import ImageExportModal, {
  ImageExportSettings,
  dpiForQuality,
} from './ImageExportModal';
import {
  compressImageForEmbed,
  compressPdfImagesOnly,
  exportFilesAsImageZip,
  rasterizePdfPage,
} from '@/utils/pdfUtils';
import { useTranslations } from '@/utils/i18n';

type PdfCompressionMode =
  | { kind: 'imageOnly'; doc: PDFDocument }
  | { kind: 'rasterized' };


export interface FileData {
  id: string;
  name: string;
  type: string;
  url: string;
  blob?: Blob;  // Store the actual blob
  arrayBuffer?: ArrayBuffer;  // Store array buffer for reuse
  pageNumber?: number;
  totalPages?: number;
  pdfGroupId?: string;  // Group ID for PDF pages from same file
  originalFileName?: string;  // Original PDF file name for grouping
  thumbnailUrl?: string;  // Thumbnail URL for PDF pages
}

export default function PDFMerger() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImageExportModal, setShowImageExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslations();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [files]);

  const handleDragStart = () => {
    // Prevent page scroll during drag on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Re-enable page scroll after drag
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragCancel = () => {
    // Re-enable page scroll if drag is cancelled
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };

  const handleFilesAdded = useCallback((newFiles: FileData[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove && fileToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    files.forEach(file => {
      if (file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    });
    setFiles([]);
  }, [files]);

  const handleUngroup = useCallback((pdfGroupId: string, fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  const handleSettingsConfirm = (settings: PDFSettings) => {
    generatePDF(settings);
  };

  const handleOpenImageExport = () => {
    setShowImageExportModal(true);
  };

  const handleImageExportConfirm = async (settings: ImageExportSettings) => {
    if (files.length === 0) return;
    setIsExporting(true);
    try {
      const zipBlob = await exportFilesAsImageZip(files, {
        format: settings.format,
        dpi: dpiForQuality(settings.quality),
      });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pdf-wizard-images-${new Date().getTime()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setShowImageExportModal(false);
    } catch (error) {
      console.error('Error exporting images:', error);
      alert(t.errors.generationFailed);
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDF = async (settings?: PDFSettings) => {
    if (files.length === 0) return;

    setIsGenerating(true);
    try {
      // Fast path: user is just compressing one PDF (all pages from the same
      // source, in original order) with compression on. Hand back the
      // surgical compressed bytes directly. pdf-lib's copyPages + save round-
      // trip would otherwise re-serialize embedded fonts and undo the work —
      // that round-trip is the actual source of the "text top cut off"
      // symptom we've been chasing, since our compressPdfImagesOnly output
      // is already a complete, valid PDF.
      const isSinglePdfInOrder =
        settings?.compress === true &&
        files[0]?.blob &&
        files.every(f => f.type === 'application/pdf') &&
        new Set(files.map(f => f.pdfGroupId)).size === 1 &&
        files.every((f, i) => f.pageNumber === i + 1);

      if (isSinglePdfInOrder) {
        const sourceBytes = await files[0].blob!.arrayBuffer();
        const result = await compressPdfImagesOnly(sourceBytes, {
          quality: settings!.quality,
        });
        const outBytes =
          result.imagesReplaced > 0 ? result.bytes : new Uint8Array(sourceBytes);
        const blob = new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `merged-pdf-${new Date().getTime()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const pdfDoc = await PDFDocument.create();
      // For each source PDF (keyed by pdfGroupId), decide once whether
      // image-only recompression yielded any savings. If it didn't (e.g. the
      // PDF uses image filters/colorspaces we don't handle), fall back to
      // per-page rasterization so the slider still has effect — at the cost
      // of text selectability for that PDF only.
      const pdfModeCache = new Map<string, PdfCompressionMode>();

      for (const file of files) {
        try {
          if (file.type === 'application/pdf') {
            // Handle PDF pages - always generate fresh ArrayBuffer from blob
            let existingPdfBytes: ArrayBuffer;

            if (file.blob) {
              // Generate fresh ArrayBuffer from blob to avoid detachment issues
              existingPdfBytes = await file.blob.arrayBuffer();
            } else {
              // Fallback to fetch if no blob available
              const response = await fetch(file.url);
              if (!response.ok) throw new Error('Failed to fetch PDF');
              existingPdfBytes = await response.arrayBuffer();
            }

            if (settings?.compress) {
              const cacheKey = file.pdfGroupId ?? file.id;
              let mode = pdfModeCache.get(cacheKey);
              if (!mode) {
                const result = await compressPdfImagesOnly(existingPdfBytes, {
                  quality: settings.quality,
                });
                if (result.imagesReplaced > 0) {
                  const compressedBuffer = result.bytes.buffer.slice(
                    result.bytes.byteOffset,
                    result.bytes.byteOffset + result.bytes.byteLength
                  ) as ArrayBuffer;
                  const doc = await PDFDocument.load(compressedBuffer);
                  mode = { kind: 'imageOnly', doc };
                } else {
                  // Image-only compression couldn't touch this PDF (unsupported
                  // filters/colorspaces). Fall back to rasterization so the
                  // slider has actual effect.
                  mode = { kind: 'rasterized' };
                }
                pdfModeCache.set(cacheKey, mode);
              }

              if (mode.kind === 'imageOnly') {
                if (file.pageNumber !== undefined) {
                  const [page] = await pdfDoc.copyPages(mode.doc, [file.pageNumber - 1]);
                  pdfDoc.addPage(page);
                } else {
                  const pages = await pdfDoc.copyPages(mode.doc, mode.doc.getPageIndices());
                  pages.forEach(p => pdfDoc.addPage(p));
                }
              } else {
                const indices: number[] = file.pageNumber !== undefined
                  ? [file.pageNumber - 1]
                  : Array.from(
                      { length: (await PDFDocument.load(existingPdfBytes)).getPageCount() },
                      (_, i) => i
                    );
                for (const idx of indices) {
                  const { jpegBytes, widthPt, heightPt } = await rasterizePdfPage(
                    existingPdfBytes,
                    idx,
                    { quality: settings.quality }
                  );
                  const img = await pdfDoc.embedJpg(jpegBytes);
                  const newPage = pdfDoc.addPage([widthPt, heightPt]);
                  newPage.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
                }
              }
            } else {
              const existingPdf = await PDFDocument.load(existingPdfBytes);
              if (file.pageNumber !== undefined) {
                const [page] = await pdfDoc.copyPages(existingPdf, [file.pageNumber - 1]);
                pdfDoc.addPage(page);
              } else {
                const pages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
                pages.forEach(page => pdfDoc.addPage(page));
              }
            }
          } else {
            // Handle images - use stored arrayBuffer or blob
            let imageBytes: ArrayBuffer;

            if (file.arrayBuffer) {
              imageBytes = file.arrayBuffer;
            } else if (file.blob) {
              imageBytes = await file.blob.arrayBuffer();
            } else {
              // Fallback to fetch (shouldn't happen with updated uploader)
              const response = await fetch(file.url);
              if (!response.ok) throw new Error('Failed to fetch image');
              imageBytes = await response.arrayBuffer();
            }

            // Normalize the input through a multi-strategy compressor that
            // guarantees pdf-lib-compatible bytes (JPEG or PNG). This also
            // protects against unusual inputs (WebP/AVIF/GIF) which would
            // otherwise be silently dropped by embedJpg/embedPng.
            const compressed = await compressImageForEmbed(imageBytes, file.type, {
              enabled: settings?.compress === true,
              quality: settings?.quality ?? 90,
            });

            const image = compressed.format === 'jpeg'
              ? await pdfDoc.embedJpg(compressed.bytes)
              : await pdfDoc.embedPng(compressed.bytes);
            
            // Determine page size and margins based on settings
            const pageSize = settings?.pageSize || 'fit';
            const marginSetting = settings?.margin || 'none';
            
            // Calculate margin values
            const getMargin = (margin: string) => {
              switch (margin) {
                case 'small': return 36; // 0.5 inch
                case 'big': return 72;   // 1 inch
                default: return 0;       // none
              }
            };
            
            const margin = getMargin(marginSetting);
            
            let page;
            if (pageSize === 'a4') {
              // A4 size: 595.28 x 841.89 points
              page = pdfDoc.addPage([595.28, 841.89]);
            } else {
              // Fit to image size
              page = pdfDoc.addPage([image.width + (margin * 2), image.height + (margin * 2)]);
            }
            
            const { width, height } = page.getSize();
            const imgWidth = image.width;
            const imgHeight = image.height;
            
            // Calculate available space considering margins
            const availableWidth = width - (margin * 2);
            const availableHeight = height - (margin * 2);
            
            // Calculate scaling to fit the image within the available space
            const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight, 1);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // Center the image within the available space
            const x = margin + (availableWidth - scaledWidth) / 2;
            const y = margin + (availableHeight - scaledHeight) / 2;
            
            page.drawImage(image, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          alert(`${t.errors.processingFailed} ${file.name}. It will be skipped.`);
        }
      }
      
      // Generate the PDF bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob and download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-pdf-${new Date().getTime()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t.errors.generationFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <FileUploader onFilesAdded={handleFilesAdded} />
      
      {files.length > 0 && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {files.length} {files.length === 1 ? t.fileList.file : t.fileList.files} {t.fileList.filesReady}
            </p>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              {t.fileList.clearAll}
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={files.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 mb-6">
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onRemove={handleRemoveFile}
                    onUngroup={handleUngroup}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleOpenSettings}
              disabled={isGenerating || isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isGenerating ? t.buttons.generating : t.buttons.downloadPdf}
            </button>
            <button
              onClick={handleOpenImageExport}
              disabled={isGenerating || isExporting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {isExporting ? t.imageExport.exporting : t.buttons.downloadAsImages}
            </button>
          </div>
        </>
      )}
      
      <PDFSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onConfirm={handleSettingsConfirm}
      />

      <ImageExportModal
        isOpen={showImageExportModal}
        pageCount={files.length}
        isExporting={isExporting}
        onClose={() => setShowImageExportModal(false)}
        onConfirm={handleImageExportConfirm}
      />
    </div>
  );
}