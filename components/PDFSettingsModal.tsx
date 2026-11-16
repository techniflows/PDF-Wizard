'use client';

import { useState } from 'react';
import { useTranslations } from './LanguageProvider';
import Modal from './Modal';
import RadioGroup, { type RadioOption } from './RadioGroup';

export type PageSize = 'fit' | 'a4';
export type Margin = 'none' | 'small' | 'big';

export interface PDFSettings {
  pageSize: PageSize;
  margin: Margin;
}

interface PDFSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opener?: HTMLElement | null;
  onConfirm: (settings: PDFSettings) => void;
}

export default function PDFSettingsModal({ isOpen, onClose, opener, onConfirm }: PDFSettingsModalProps) {
  const [settings, setSettings] = useState<PDFSettings>({ pageSize: 'a4', margin: 'none' });
  const t = useTranslations();

  if (!isOpen) return null;

  const pageSizes: RadioOption<PageSize>[] = [
    { value: 'a4', ...t.settings.pageSizes.a4 },
    { value: 'fit', ...t.settings.pageSizes.fit },
  ];
  const margins: RadioOption<Margin>[] = [
    { value: 'none', label: t.settings.margins.none },
    { value: 'small', label: t.settings.margins.small },
    { value: 'big', label: t.settings.margins.big },
  ];

  const handleConfirm = () => {
    onConfirm(settings);
    onClose();
  };

  return (
    <Modal
      title={t.settings.title}
      onClose={onClose}
      opener={opener}
      confirm={{ label: t.settings.confirm, onConfirm: handleConfirm }}
    >
      <RadioGroup
        legend={t.settings.pageSize}
        name="pageSize"
        options={pageSizes}
        value={settings.pageSize}
        onChange={(pageSize) => setSettings((prev) => ({ ...prev, pageSize }))}
      />
      <RadioGroup
        legend={t.settings.margin}
        name="margin"
        options={margins}
        value={settings.margin}
        onChange={(margin) => setSettings((prev) => ({ ...prev, margin }))}
      />
    </Modal>
  );
}
