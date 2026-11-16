'use client';

import { useState } from 'react';
import { format } from '@/utils/i18n';
import type { ImageExportOptions } from '@/utils/pdfUtils';
import { useTranslations } from './LanguageProvider';
import Modal, { ModalNote } from './Modal';
import RadioGroup, { type RadioOption } from './RadioGroup';

export type ImageExportSettings = ImageExportOptions;

interface ImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  opener?: HTMLElement | null;
  onConfirm: (settings: ImageExportSettings) => void;
  pageCount: number;
  isExporting: boolean;
}

export default function ImageExportModal({ isOpen, onClose, opener, onConfirm, pageCount, isExporting }: ImageExportModalProps) {
  const [settings, setSettings] = useState<ImageExportSettings>({ format: 'png', quality: 'high' });
  const t = useTranslations();

  if (!isOpen) return null;

  const formats: RadioOption<ImageExportSettings['format']>[] = [
    { value: 'png', label: 'PNG', description: t.imageExport.pngDescription },
    { value: 'jpeg', label: 'JPG', description: t.imageExport.jpgDescription },
  ];
  const qualities: RadioOption<ImageExportSettings['quality']>[] = [
    { value: 'low', label: t.imageExport.qualityLow, description: t.imageExport.qualityLowDesc },
    { value: 'medium', label: t.imageExport.qualityMedium, description: t.imageExport.qualityMediumDesc },
    { value: 'high', label: t.imageExport.qualityHigh, description: t.imageExport.qualityHighDesc },
  ];

  return (
    <Modal
      title={t.imageExport.title}
      onClose={onClose}
      opener={opener}
      busy={isExporting}
      confirm={{
        label: t.imageExport.export,
        busyLabel: t.imageExport.exporting,
        onConfirm: () => onConfirm(settings),
      }}
    >
      <ModalNote>
        {pageCount === 1
          ? t.imageExport.singlePageNote
          : format(t.imageExport.multiPageNote, { count: pageCount })}
      </ModalNote>
      <RadioGroup
        legend={t.imageExport.format}
        name="format"
        options={formats}
        value={settings.format}
        onChange={(value) => setSettings((prev) => ({ ...prev, format: value }))}
        disabled={isExporting}
      />
      <RadioGroup
        legend={t.imageExport.quality}
        name="quality"
        options={qualities}
        value={settings.quality}
        onChange={(quality) => setSettings((prev) => ({ ...prev, quality }))}
        disabled={isExporting}
      />
    </Modal>
  );
}
