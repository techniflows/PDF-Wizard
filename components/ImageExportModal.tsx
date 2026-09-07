'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/utils/i18n';

export type ImageFormat = 'png' | 'jpg';
export type ImageQuality = 'low' | 'medium' | 'high';

export interface ImageExportSettings {
  format: ImageFormat;
  quality: ImageQuality;
}

interface ImageExportModalProps {
  isOpen: boolean;
  pageCount: number;
  isExporting: boolean;
  onClose: () => void;
  onConfirm: (settings: ImageExportSettings) => void;
}

export const dpiForQuality = (q: ImageQuality): number =>
  q === 'low' ? 72 : q === 'medium' ? 150 : 300;

const defaultSettings: ImageExportSettings = { format: 'png', quality: 'high' };

export default function ImageExportModal({
  isOpen,
  pageCount,
  isExporting,
  onClose,
  onConfirm,
}: ImageExportModalProps) {
  const [settings, setSettings] = useState<ImageExportSettings>(defaultSettings);
  const t = useTranslations();

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = () => {
    onConfirm(settings);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t.imageExport.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={t.settings.cancel}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md p-3 mb-5 text-sm">
          {t.imageExport.pagesInfo.replace('{n}', String(pageCount))}
        </div>

        <div className="mb-5">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.imageExport.formatLabel}
          </div>
          <div className="space-y-2">
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="format"
                value="png"
                checked={settings.format === 'png'}
                onChange={() => setSettings(s => ({ ...s, format: 'png' }))}
                className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">PNG</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t.imageExport.pngDescription}
                </div>
              </div>
            </label>
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="format"
                value="jpg"
                checked={settings.format === 'jpg'}
                onChange={() => setSettings(s => ({ ...s, format: 'jpg' }))}
                className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">JPG</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t.imageExport.jpgDescription}
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.imageExport.qualityLabel}
          </div>
          <div className="space-y-2">
            {(['low', 'medium', 'high'] as const).map(q => (
              <label key={q} className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  value={q}
                  checked={settings.quality === q}
                  onChange={() => setSettings(s => ({ ...s, quality: q }))}
                  className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {t.imageExport.qualityNames[q]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t.imageExport.qualityDetails[q]}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-md transition-colors"
          >
            {t.settings.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isExporting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors"
          >
            {isExporting ? t.imageExport.exporting : t.imageExport.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
