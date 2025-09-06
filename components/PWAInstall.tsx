'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice = /mobile|android|iphone|ipad|ipod/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone || // eslint-disable-line @typescript-eslint/no-explicit-any
                        document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // Show install prompt after user interaction on mobile
    if (isMobileDevice && !isStandalone) {
      // Show install button after a delay or user interaction
      setTimeout(() => {
        setShowInstallInstructions(true);
      }, 5000); // Show after 5 seconds
    }

    // Handle Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallInstructions(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful installation
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setIsInstalled(true);
      setShowInstallInstructions(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check if recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setShowInstallInstructions(false);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS-specific instructions
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show Android install prompt
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallInstructions(false);
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    } else if (isAndroid) {
      // Fallback for Android without prompt
      alert('홈 화면에 추가하려면:\n1. 브라우저 메뉴(⋮)를 탭하세요\n2. "홈 화면에 추가" 또는 "앱 설치"를 선택하세요');
    }
  };

  const handleDismiss = () => {
    setShowInstallInstructions(false);
    setShowIOSInstructions(false);
    // Store dismissal to not show again for some time
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button/Banner */}
      {showInstallInstructions && !showIOSInstructions && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8 8-8-8" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                PDF Wizard 설치하기
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                홈 화면에 추가하여 앱처럼 사용하세요. 오프라인에서도 작동합니다!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  {isIOS ? '설치 방법 보기' : '지금 설치'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-xs font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              iOS에서 설치하기
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  1
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Safari 브라우저 하단의 공유 버튼
                  <span className="inline-flex items-center justify-center w-5 h-5 ml-1 align-middle">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 8.586V3a1 1 0 011-1z"/>
                      <path d="M4 9a1 1 0 011 1v6h10v-6a1 1 0 112 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a1 1 0 011-1z"/>
                    </svg>
                  </span>
                  을 탭하세요
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  2
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  &ldquo;홈 화면에 추가&rdquo;를 선택하세요
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  3
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  오른쪽 상단의 &ldquo;추가&rdquo;를 탭하세요
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>참고:</strong> Safari 브라우저에서만 설치 가능합니다
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}