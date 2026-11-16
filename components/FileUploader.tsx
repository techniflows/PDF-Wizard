'use client';

import React, { useState } from 'react';
import { format } from '@/utils/i18n';
import { extractPdfPages, fitCanvasSize } from '@/utils/pdfUtils';
import { useTranslations } from './LanguageProvider';
import type { FileData } from './PDFMerger';

// pdf-lib embeds only JPEG and PNG, so WebP, GIF and the rest are re-encoded.
const EMBEDDABLE_TYPES = ['image/jpeg', 'image/png'];

async function convertToPng(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  Object.assign(canvas, fitCanvasSize(bitmap.width, bitmap.height));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to convert image'))), 'image/png');
  });
}

interface FileUploaderProps {
  inputRef?: React.Ref<HTMLInputElement>;
  onFilesAdded: (files: FileData[]) => void;
}

export default function FileUploader({ inputRef, onFilesAdded }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations();

  const processFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    const newFiles: FileData[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      try {
        if (file.type === 'application/pdf') {
          const pdfPages = await extractPdfPages(file);
          newFiles.push(...pdfPages);
        } else if (file.name.toLowerCase().endsWith('.heic')) {
          // Imported on demand because heic2any cannot be loaded during SSR.
          const heic2any = (await import('heic2any')).default;
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
          }) as Blob;

          const url = URL.createObjectURL(convertedBlob);
          const arrayBuffer = await convertedBlob.arrayBuffer();

          newFiles.push({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name.replace(/\.heic$/i, '.jpg'),
            type: 'image/jpeg',
            url: url,
            blob: convertedBlob,
            arrayBuffer: arrayBuffer,
            included: true,
          });
        } else if (file.type.startsWith('image/')) {
          const blob = EMBEDDABLE_TYPES.includes(file.type) ? file : await convertToPng(file);

          newFiles.push({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            type: blob.type,
            url: URL.createObjectURL(blob),
            blob,
            arrayBuffer: await blob.arrayBuffer(),
            included: true,
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(format(t.errors.processingFailed, { name: file.name }));
      }
    }

    if (newFiles.length > 0) {
      onFilesAdded(newFiles);
    }
    setIsProcessing(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    if (input.files && input.files.length > 0) {
      await processFiles(input.files);
      // Without the reset, picking the same file again fires no change event.
      input.value = '';
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!isProcessing && files && files.length > 0) {
      await processFiles(files);
    }
  };

  return (
    <label
      className={`mb-6 block rounded-lg border border-dashed border-neutral-300 p-8 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-600 dark:border-neutral-700 dark:has-[:focus-visible]:outline-blue-400 ${
        isProcessing ? 'cursor-wait opacity-50' : 'cursor-pointer hover:border-neutral-500 dark:hover:border-neutral-500'
      }`}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.heic"
        onChange={handleFileChange}
        className="sr-only"
        disabled={isProcessing}
      />

      {isProcessing ? (
        <svg className="mx-auto h-10 w-10 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="mx-auto mb-4 h-10 w-10 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Stays mounted so screen readers announce the text when it changes. */}
      <span
        role="status"
        className={isProcessing ? 'mt-4 block font-medium text-neutral-700 dark:text-neutral-300' : 'sr-only'}
      >
        {isProcessing ? t.upload.processing : ''}
      </span>

      {!isProcessing && (
        <>
          <span className="block font-medium text-neutral-700 dark:text-neutral-300">
            {t.upload.dragDrop} <span className="text-blue-600 dark:text-blue-400">{t.upload.clickToSelect}</span>
          </span>
          <span className="mt-2 block text-sm text-neutral-500 dark:text-neutral-400">{t.upload.supportedFormats}</span>
        </>
      )}
    </label>
  );
}
