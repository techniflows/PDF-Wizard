'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileData } from './PDFMerger';
import ZoomableThumbnail from './ZoomableThumbnail';

interface FileItemProps {
  file: FileData;
  onRemove: (id: string) => void;
  onUngroup?: (pdfGroupId: string, fileId: string) => void;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export default function FileItem({ 
  file, 
  onRemove, 
  onUngroup
}: Omit<FileItemProps, 'isFirstInGroup' | 'isLastInGroup'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPdfPage = file.pdfGroupId !== undefined;

  const handleUngroup = () => {
    if (file.pdfGroupId && onUngroup) {
      onUngroup(file.pdfGroupId, file.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 ${
        isDragging ? 'shadow-lg' : ''
      } ${isPdfPage ? 'ml-6 border-l-4 border-l-blue-300 dark:border-l-blue-400' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      {/* File preview */}
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
        {file.type.startsWith('image/') || (file.type === 'application/pdf' && file.thumbnailUrl) ? (
          <ZoomableThumbnail
            src={file.thumbnailUrl || file.url}
            alt={file.name}
            className="w-full h-full"
          />
        ) : (
          <svg
            className="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {file.name}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {file.type.replace('image/', '').replace('application/', '').toUpperCase()}
          </p>
          {isPdfPage && file.originalFileName && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              from {file.originalFileName}
            </span>
          )}
        </div>
      </div>

      {/* Ungroup button for PDF pages */}
      {isPdfPage && onUngroup && (
        <button
          onClick={handleUngroup}
          className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-2"
          title="Ungroup from PDF"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m0 6l-6-6"
            />
          </svg>
        </button>
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(file.id)}
        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        aria-label="Remove file"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}