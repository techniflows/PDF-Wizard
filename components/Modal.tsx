'use client';

import React, { useEffect, useId, useRef } from 'react';
import { useTranslations } from './LanguageProvider';
import { buttonPrimary, buttonSecondary, iconButton } from './styles';

interface ModalProps {
  title: string;
  onClose: () => void;
  // Safari does not focus a button on mouse click, so the active element alone can miss the opener.
  opener?: HTMLElement | null;
  busy?: boolean;
  confirm?: {
    label: string;
    busyLabel?: string;
    onConfirm: () => void;
  };
  children: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

// A disabled opener cannot take focus. Focus waits on the opener's nearest
// focusable ancestor and moves back once the opener is enabled again.
function restoreFocus(opener: Element | null) {
  if (!(opener instanceof HTMLElement)) return;
  opener.focus();
  if (document.activeElement === opener) return;

  const fallback = opener.closest<HTMLElement>('[tabindex]');
  fallback?.focus();

  const observer = new MutationObserver(() => {
    if (opener.matches(':disabled')) return;
    observer.disconnect();
    const active = document.activeElement;
    if (active === fallback || active === document.body) opener.focus();
  });
  observer.observe(opener, { attributes: true, attributeFilter: ['disabled'] });
}

export default function Modal({ title, onClose, opener, busy = false, confirm, children }: ModalProps) {
  const t = useTranslations();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef(opener);

  useEffect(() => {
    const returnTarget = openerRef.current ?? document.activeElement;
    dialogRef.current?.focus();
    return () => restoreFocus(returnTarget);
  }, []);

  // Going busy disables whichever button had focus, which would drop focus to <body>.
  useEffect(() => {
    if (busy) dialogRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0] ?? dialog;
      const last = focusable[focusable.length - 1] ?? dialog;
      const active = document.activeElement;

      if (!dialog.contains(active) || active === (event.shiftKey ? first : last) || (event.shiftKey && active === dialog)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !busy) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={handleOverlayClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-neutral-200 bg-white p-6 outline-none dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label={t.common.close} className={`-mr-2 ${iconButton}`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">{children}</div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className={buttonSecondary}>
            {confirm ? t.common.cancel : t.common.close}
          </button>
          {confirm && (
            <button type="button" onClick={confirm.onConfirm} disabled={busy} className={buttonPrimary}>
              {busy && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {busy && confirm.busyLabel ? confirm.busyLabel : confirm.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
      {children}
    </p>
  );
}
