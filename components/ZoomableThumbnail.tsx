'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ZoomableThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableThumbnail({ src, alt, className = '' }: ZoomableThumbnailProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsZoomed(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Add small delay to prevent flickering when moving between thumbnail and modal
    hideTimeoutRef.current = setTimeout(() => {
      setIsZoomed(false);
    }, 100);
  }, []);

  const handleOverlayMouseMove = useCallback((e: React.MouseEvent) => {
    // Get the inner image container
    const imageContainer = e.currentTarget.querySelector('.image-container') as HTMLElement;
    if (!imageContainer) return;
    
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // If mouse is outside the image container, close modal
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsZoomed(false);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsZoomed(true);
  }, []);

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsZoomed(false);
    }
  }, []);

  const handleCloseZoom = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsZoomed(false);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative overflow-hidden cursor-zoom-in ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        <Image
          src={src}
          alt={alt}
          width={200}
          height={200}
          className="w-full h-full object-cover rounded"
        />
      </div>

      {/* Zoomed overlay */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClickOutside}
          onTouchEnd={handleCloseZoom}
          onMouseMove={handleOverlayMouseMove}
        >
          <div 
            className="relative flex items-center justify-center image-container"
            onMouseEnter={handleMouseEnter}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="object-contain shadow-2xl rounded-lg border-4 border-white"
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
              className="absolute top-4 right-4 text-gray-600 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200 shadow-lg border-2 border-gray-300"
              onClick={handleCloseZoom}
              aria-label="Close zoom"
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
        </div>
      )}
    </>
  );
}