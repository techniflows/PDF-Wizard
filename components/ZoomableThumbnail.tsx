'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from './LanguageProvider';
import { iconButton } from './styles';

interface ZoomableThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableThumbnail({ src, alt, className = '' }: ZoomableThumbnailProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations();

  const cancelPendingHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    cancelPendingHide();
    setIsZoomed(true);
  }, [cancelPendingHide]);

  const handleMouseLeave = useCallback(() => {
    // The delay stops flicker while the pointer moves from the thumbnail onto the preview.
    hideTimeoutRef.current = setTimeout(() => {
      setIsZoomed(false);
    }, 100);
  }, []);

  const handleCloseZoom = useCallback(() => {
    cancelPendingHide();
    setIsZoomed(false);
  }, [cancelPendingHide]);

  const handleOverlayMouseMove = useCallback((e: React.MouseEvent) => {
    const imageContainer = e.currentTarget.querySelector('.image-container') as HTMLElement;
    if (!imageContainer) return;

    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      handleCloseZoom();
    }
  }, [handleCloseZoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsZoomed(true);
  }, []);

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsZoomed(false);
    }
  }, []);

  useEffect(() => cancelPendingHide, [cancelPendingHide]);

  return (
    <>
      <div
        className={`relative cursor-zoom-in overflow-hidden ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        <Image
          src={src}
          alt={alt}
          width={200}
          height={200}
          className="h-full w-full rounded-md object-cover"
        />
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClickOutside}
          onTouchEnd={handleCloseZoom}
          onMouseMove={handleOverlayMouseMove}
        >
          <div
            className="image-container relative flex items-center justify-center"
            onMouseEnter={handleMouseEnter}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="rounded-lg border border-neutral-300 object-contain shadow-md"
              style={{
                width: '80vw',
                height: '80vh',
                maxWidth: '80vw',
                maxHeight: '80vh',
                opacity: 1,
                backgroundColor: 'white',
              }}
            />
            <button
              type="button"
              className={`absolute top-4 right-4 border border-neutral-300 bg-white dark:border-neutral-300 dark:bg-white dark:text-neutral-500 dark:hover:bg-neutral-100 dark:hover:text-neutral-900 ${iconButton}`}
              onClick={handleCloseZoom}
              aria-label={t.fileList.closePreview}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
