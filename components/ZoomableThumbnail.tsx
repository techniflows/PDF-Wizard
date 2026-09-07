'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ZoomableThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableThumbnail({ src, alt, className = '' }: ZoomableThumbnailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) close();
    },
    [close]
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    },
    [open]
  );

  return (
    <>
      <div
        className={`relative overflow-hidden cursor-zoom-in ${className}`}
        onClick={open}
        onKeyDown={handleTriggerKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Open zoomed preview"
      >
        <Image
          src={src}
          alt={alt}
          width={200}
          height={200}
          className="w-full h-full object-cover rounded"
        />
      </div>

      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-150 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleBackdropClick}
        >
          <div
            className={`relative flex items-center justify-center transition-transform duration-150 ease-out ${
              isVisible ? 'scale-100' : 'scale-95'
            }`}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="object-contain shadow-2xl rounded-lg bg-white"
              style={{
                width: '55vw',
                height: '70vh',
                maxWidth: '720px',
                maxHeight: '80vh',
              }}
            />
            <button
              className="absolute top-3 right-3 text-gray-700 bg-white hover:bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center transition-colors duration-150 shadow-lg z-10"
              onClick={close}
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
