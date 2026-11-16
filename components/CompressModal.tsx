'use client';

import { useState } from 'react';
import { formatCount } from '@/utils/i18n';
import type { CompressionLevel, PdfCompressionMethod } from '@/utils/pdfUtils';
import { useTranslations } from './LanguageProvider';
import Modal, { ModalNote } from './Modal';
import RadioGroup, { type RadioOption } from './RadioGroup';

export type CompressType = 'image' | 'pdf';

interface CompressModalProps {
  isOpen: boolean;
  onClose: () => void;
  opener?: HTMLElement | null;
  onConfirm: (level: CompressionLevel, method: PdfCompressionMethod) => void;
  compressType: CompressType;
  fileCount: number;
  isCompressing: boolean;
}

export default function CompressModal({
  isOpen,
  onClose,
  opener,
  onConfirm,
  compressType,
  fileCount,
  isCompressing,
}: CompressModalProps) {
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [method, setMethod] = useState<PdfCompressionMethod>('keep-text');
  const t = useTranslations();

  if (!isOpen) return null;

  const copy = {
    image: { title: t.compress.imageTitle, note: t.compress.imageNote },
    pdf: { title: t.compress.pdfTitle, note: t.compress.pdfNote },
  }[compressType];

  const levels: RadioOption<CompressionLevel>[] = [
    { value: 'low', label: t.compress.levelLow, description: t.compress.levelLowDesc },
    { value: 'medium', label: t.compress.levelMedium, description: t.compress.levelMediumDesc },
    { value: 'high', label: t.compress.levelHigh, description: t.compress.levelHighDesc },
  ];

  const methods: RadioOption<PdfCompressionMethod>[] = [
    { value: 'keep-text', label: t.compress.methodKeepText, description: t.compress.methodKeepTextDesc },
    { value: 'flatten', label: t.compress.methodFlatten, description: t.compress.methodFlattenDesc },
  ];

  return (
    <Modal
      title={copy.title}
      onClose={onClose}
      opener={opener}
      busy={isCompressing}
      confirm={{
        label: t.compress.compress,
        busyLabel: t.compress.compressing,
        onConfirm: () => onConfirm(level, method),
      }}
    >
      <ModalNote>{formatCount(copy.note, fileCount)}</ModalNote>
      {compressType === 'pdf' && (
        <RadioGroup
          legend={t.compress.method}
          name="method"
          options={methods}
          value={method}
          onChange={setMethod}
          disabled={isCompressing}
        />
      )}
      <RadioGroup
        legend={t.compress.level}
        name="level"
        options={levels}
        value={level}
        onChange={setLevel}
        disabled={isCompressing}
      />
    </Modal>
  );
}
