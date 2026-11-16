'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from './LanguageProvider';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export default function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
  const t = useTranslations();

  return (
    <div role="status" className="sticky top-0 z-40">
      {!isOnline && (
        <p className="bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
          {t.offline}
        </p>
      )}
    </div>
  );
}
