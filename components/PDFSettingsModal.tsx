'use client';

import React, { useState } from 'react';

export type PageSize = 'fit' | 'a4';
export type Margin = 'none' | 'small' | 'big';

export interface PDFSettings {
  pageSize: PageSize;
  margin: Margin;
}

interface PDFSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: PDFSettings) => void;
  initialSettings?: PDFSettings;
}

const defaultSettings: PDFSettings = {
  pageSize: 'fit',
  margin: 'none'
};

export default function PDFSettingsModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialSettings = defaultSettings 
}: PDFSettingsModalProps) {
  const [settings, setSettings] = useState<PDFSettings>(initialSettings);

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
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">PDF Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Page Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Page Size
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pageSize"
                  value="fit"
                  checked={settings.pageSize === 'fit'}
                  onChange={(e) => setSettings(prev => ({ ...prev, pageSize: e.target.value as PageSize }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Fit to Image</div>
                  <div className="text-sm text-gray-500">Same page size as image</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pageSize"
                  value="a4"
                  checked={settings.pageSize === 'a4'}
                  onChange={(e) => setSettings(prev => ({ ...prev, pageSize: e.target.value as PageSize }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">A4</div>
                  <div className="text-sm text-gray-500">Standard A4 page size</div>
                </div>
              </label>
            </div>
          </div>

          {/* Margin Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Margin
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="margin"
                  value="none"
                  checked={settings.margin === 'none'}
                  onChange={(e) => setSettings(prev => ({ ...prev, margin: e.target.value as Margin }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span>No Margin</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="margin"
                  value="small"
                  checked={settings.margin === 'small'}
                  onChange={(e) => setSettings(prev => ({ ...prev, margin: e.target.value as Margin }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span>Small Margin</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="margin"
                  value="big"
                  checked={settings.margin === 'big'}
                  onChange={(e) => setSettings(prev => ({ ...prev, margin: e.target.value as Margin }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span>Big Margin</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}