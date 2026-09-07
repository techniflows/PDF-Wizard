'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/utils/i18n';

export type PageSize = 'fit' | 'a4';
export type Margin = 'none' | 'small' | 'big';

export interface PDFSettings {
  pageSize: PageSize;
  margin: Margin;
  compress: boolean;
  quality: number;
}

interface PDFSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: PDFSettings) => void;
  initialSettings?: PDFSettings;
}

export const defaultPDFSettings: PDFSettings = {
  pageSize: 'a4',
  margin: 'none',
  compress: false,
  quality: 90
};

export default function PDFSettingsModal({
  isOpen,
  onClose,
  onConfirm,
  initialSettings = defaultPDFSettings
}: PDFSettingsModalProps) {
  const [settings, setSettings] = useState<PDFSettings>(initialSettings);
  const t = useTranslations();

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(settings);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t.settings.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={t.settings.cancel}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Page Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t.settings.pageSize}
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pageSize"
                  value="a4"
                  checked={settings.pageSize === 'a4'}
                  onChange={(e) => setSettings(prev => ({ ...prev, pageSize: e.target.value as PageSize }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.settings.pageSizes.a4}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.settings.pageSizes.a4Description}</div>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pageSize"
                  value="fit"
                  checked={settings.pageSize === 'fit'}
                  onChange={(e) => setSettings(prev => ({ ...prev, pageSize: e.target.value as PageSize }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.settings.pageSizes.fit}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.settings.pageSizes.fitDescription}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Margin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t.settings.margin}
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="margin"
                  value="none"
                  checked={settings.margin === 'none'}
                  onChange={(e) => setSettings(prev => ({ ...prev, margin: e.target.value as Margin }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-100">{t.settings.margins.none}</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="margin"
                  value="small"
                  checked={settings.margin === 'small'}
                  onChange={(e) => setSettings(prev => ({ ...prev, margin: e.target.value as Margin }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-100">{t.settings.margins.small}</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="margin"
                  value="big"
                  checked={settings.margin === 'big'}
                  onChange={(e) => setSettings(prev => ({ ...prev, margin: e.target.value as Margin }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-100">{t.settings.margins.big}</span>
              </label>
            </div>
          </div>

          {/* Compression toggle + slider */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.settings.compress}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.settings.compressDescription}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.compress}
                onClick={() => setSettings(prev => ({ ...prev, compress: !prev.compress }))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.compress ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    settings.compress ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            {settings.compress && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="quality" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.settings.quality}
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                    {settings.quality}
                  </span>
                </div>
                <input
                  id="quality"
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>{t.settings.qualityLow}</span>
                  <span>{t.settings.qualityHigh}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            {t.settings.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {t.settings.generate}
          </button>
        </div>
      </div>
    </div>
  );
}
