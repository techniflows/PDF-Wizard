'use client';

import React, { useCallback, useRef, useState } from 'react';
import { FileData } from './PDFMerger';
import { extractPdfPages } from '@/utils/pdfUtils';
import { useTranslations } from '@/utils/i18n';

interface FileUploaderProps {
  onFilesAdded: (files: FileData[]) => void;
}

export default function FileUploader({ onFilesAdded }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations();

  const processFiles = useCallback(async (fileList: FileList) => {
    setIsProcessing(true);
    const newFiles: FileData[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      try {
        if (file.type === 'application/pdf') {
          // Extract PDF pages on client side
          const pdfPages = await extractPdfPages(file);
          newFiles.push(...pdfPages);
        } else if (file.name.toLowerCase().endsWith('.heic')) {
          // Convert HEIC to JPEG - dynamic import to avoid SSR issues
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
          });
        } else if (file.type.startsWith('image/')) {
          // Handle regular images
          const url = URL.createObjectURL(file);
          const arrayBuffer = await file.arrayBuffer();
          
          newFiles.push({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type,
            url: url,
            blob: file,
            arrayBuffer: arrayBuffer,
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`${t.errors.processingFailed} ${file.name}. ${t.errors.tryAgain}`);
      }
    }
    
    if (newFiles.length > 0) {
      onFilesAdded(newFiles);
    }
    setIsProcessing(false);
  }, [onFilesAdded]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [processFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 mb-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${
        isProcessing ? 'opacity-50 cursor-wait' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={isProcessing ? undefined : handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.heic"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="mb-4">
          <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-4">{t.upload.processing}</p>
        </div>
      ) : (
        <>
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.upload.dragDrop} <span className="text-blue-600 dark:text-blue-400">{t.upload.clickToSelect}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.upload.supportedFormats}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t.privacyDescription}
          </p>
        </>
      )}
    </div>
  );
}