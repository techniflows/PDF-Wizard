'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from './LanguageProvider';
import Modal, { ModalNote } from './Modal';
import { buttonPrimary, buttonSecondary } from './styles';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'other';
type View = 'hidden' | 'banner' | 'ios-steps';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSAL_MS = 24 * 60 * 60 * 1000;
const MOBILE_BANNER_DELAY_MS = 5000;

function wasDismissedRecently(): boolean {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY));
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISSAL_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export default function PWAInstall() {
  const [platform, setPlatform] = useState<Platform>('other');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [view, setView] = useState<View>('hidden');
  const [stepsOpener, setStepsOpener] = useState<HTMLElement | null>(null);
  const t = useTranslations();

  useEffect(() => {
    if (isStandalone()) return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'other');

    const mayShowBanner = !wasDismissedRecently();
    const showBanner = () => {
      if (mayShowBanner) setView((current) => (current === 'hidden' ? 'banner' : current));
    };

    const bannerTimer = /mobile/.test(userAgent) || isIOS || isAndroid
      ? window.setTimeout(showBanner, MOBILE_BANNER_DELAY_MS)
      : undefined;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      showBanner();
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setView('hidden');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.clearTimeout(bannerTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async (event: React.MouseEvent<HTMLElement>) => {
    if (platform === 'ios') {
      setStepsOpener(event.currentTarget);
      setView('ios-steps');
    } else if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallPrompt(null);
          setView('hidden');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    } else if (platform === 'android') {
      alert(t.install.androidFallback);
    }
  };

  const handleDismiss = () => {
    setView('hidden');
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {}
  };

  if (view === 'hidden') return null;

  // The banner stays mounted under the steps dialog so its button can take focus back on close.
  return (
    <>
      {/* Reserves scroll room on phones, where the fixed banner would otherwise cover the download buttons. */}
      <div aria-hidden="true" className="h-44 md:hidden" />
      <div className="animate-slide-up fixed inset-x-4 bottom-4 z-40 rounded-lg border border-neutral-200 bg-white p-4 md:left-auto md:w-96 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm font-semibold">{t.install.title}</p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{t.install.description}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={handleInstall} className={buttonPrimary}>
            {platform === 'ios' ? t.install.installMethod : t.install.installNow}
          </button>
          <button type="button" onClick={handleDismiss} className={buttonSecondary}>
            {t.install.notNow}
          </button>
        </div>
      </div>

      {view === 'ios-steps' && (
        <Modal title={t.install.iosTitle} onClose={() => setView('banner')} opener={stepsOpener}>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              {t.install.iosStep1}
              <svg className="ml-1 inline h-4 w-4 align-text-bottom" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 2a1 1 0 011 1v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 8.586V3a1 1 0 011-1z" />
                <path d="M4 9a1 1 0 011 1v6h10v-6a1 1 0 112 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a1 1 0 011-1z" />
              </svg>
            </li>
            <li>{t.install.iosStep2}</li>
            <li>{t.install.iosStep3}</li>
          </ol>
          <ModalNote>{t.install.iosNote}</ModalNote>
        </Modal>
      )}
    </>
  );
}
