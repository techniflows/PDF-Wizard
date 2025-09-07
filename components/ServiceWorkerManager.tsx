'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Handle online/offline events
    const handleOnline = () => {
      console.log('🌐 Back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📵 Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Check if already registered first
          const existingRegistration = await navigator.serviceWorker.getRegistration('/');
          
          if (existingRegistration) {
            console.log('✅ Service Worker already registered:', existingRegistration.scope);
            setIsInstalled(true);
          } else {
            // Register service worker manually
            const registration = await navigator.serviceWorker.register('/sw.js', { 
              scope: '/' 
            });
            console.log('✅ Service Worker registered manually:', registration.scope);
            setIsInstalled(true);
          }
          
          // Get current registration for event handling
          const registration = await navigator.serviceWorker.getRegistration('/');
          
          if (registration) {
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 New content available');
                    
                    // Auto-update in offline mode, ask in online mode
                    if (!navigator.onLine) {
                      newWorker.postMessage({ action: 'skipWaiting' });
                    } else if (confirm('새로운 업데이트가 있습니다. 페이지를 새로고침하시겠습니까?')) {
                      window.location.reload();
                    }
                  }
                });
              }
            });

            // Check service worker states
            if (registration.waiting) {
              console.log('⏳ Service Worker waiting');
            }
            
            if (registration.active) {
              console.log('🟢 Service Worker active:', registration.active.state);
            }

            // Pre-cache critical resources for offline use
            if (registration.active && !isOnline) {
              registration.active.postMessage({
                action: 'CACHE_CRITICAL_RESOURCES'
              });
            }
          }

        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      };

      // Register immediately if document is ready, otherwise wait for load
      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from SW:', event.data);
        
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('💾 Cache updated:', event.data.payload);
        } else if (event.data.type === 'OFFLINE_READY') {
          console.log('📱 App ready for offline use');
        }
      });

      // Listen for service worker controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Controller changed');
        // Only reload if we're online to avoid breaking offline functionality
        if (navigator.onLine) {
          window.location.reload();
        }
      });

      // Check if controlling service worker exists
      if (navigator.serviceWorker.controller) {
        console.log('🎮 Service Worker controlling');
        setIsInstalled(true);
      }

      return () => {
        window.removeEventListener('load', registerSW);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show offline status in development
  useEffect(() => {
    if (!isOnline) {
      console.log('📱 Running in offline mode - all features should work!');
    }
  }, [isOnline]);

  return null; // This component doesn't render anything
}