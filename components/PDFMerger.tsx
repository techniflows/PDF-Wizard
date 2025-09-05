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
import { PDFDocument, rgb } from 'pdf-lib';
import FileUploader from './FileUploader';
import FileItem from './FileItem';
import PDFSettingsModal, { PDFSettings } from './PDFSettingsModal';


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

  const sensors = useSensors(
    useSensor(PointerSensor),
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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

  const generatePDF = async (settings?: PDFSettings) => {
    if (files.length === 0) return;
    
    setIsGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
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
            
            const existingPdf = await PDFDocument.load(existingPdfBytes);
            
            // If pageNumber is specified, copy only that page
            if (file.pageNumber !== undefined) {
              const [page] = await pdfDoc.copyPages(existingPdf, [file.pageNumber - 1]);
              pdfDoc.addPage(page);
            } else {
              // Copy all pages
              const pages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
              pages.forEach(page => pdfDoc.addPage(page));
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
            
            let image;
            
            // Try to embed as PNG first, then fall back to JPG
            try {
              if (file.type.includes('png')) {
                image = await pdfDoc.embedPng(imageBytes);
              } else {
                image = await pdfDoc.embedJpg(imageBytes);
              }
            } catch (embedError) {
              console.error(`Failed to embed ${file.name}, trying alternative format`, embedError);
              // If embedding fails, try the opposite format
              if (file.type.includes('png')) {
                image = await pdfDoc.embedJpg(imageBytes);
              } else {
                image = await pdfDoc.embedPng(imageBytes);
              }
            }
            
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
          alert(`Failed to process ${file.name}. It will be skipped.`);
        }
      }
      
      // Generate the PDF bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-pdf-${new Date().getTime()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
            <p className="text-sm text-gray-600">
              {files.length} file{files.length !== 1 ? 's' : ''} ready to merge
            </p>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
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

          <button
            onClick={handleOpenSettings}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isGenerating ? 'Generating PDF...' : 'Download Merged PDF'}
          </button>
        </>
      )}
      
      <PDFSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onConfirm={handleSettingsConfirm}
      />
    </div>
  );
}