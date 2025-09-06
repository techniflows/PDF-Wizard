'use client';

import React, { useState, useSyncExternalStore } from 'react';

// Custom hook using React's recommended pattern for external stores
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true // Server-side fallback
  );
}

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  // Handle toast visibility
  React.useEffect(() => {
    if (!isOnline && !hasBeenOffline) {
      setShowOfflineToast(true);
      setHasBeenOffline(true);
      // Hide toast after 5 seconds
      const timer = setTimeout(() => setShowOfflineToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (isOnline && !showOfflineToast) return null;

  return (
    <>
      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-medium z-50">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
            오프라인 모드 - 모든 기능이 정상적으로 작동합니다
          </div>
        </div>
      )}

      {/* Offline Toast */}
      {showOfflineToast && !isOnline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                오프라인 모드
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                인터넷 연결이 없지만 PDF Wizard는 계속 사용할 수 있습니다!
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                • PDF 병합/분할 • 이미지 변환 • 페이지 재정렬 • 100% 로컬 처리
              </p>
              <button
                onClick={() => setShowOfflineToast(false)}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              >
                닫기
              </button>
            </div>
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
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}