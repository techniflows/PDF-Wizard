'use client';

import { useEffect } from 'react';

export default function ServiceWorkerManager() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Check if already registered first
          const existingRegistration = await navigator.serviceWorker.getRegistration('/');
          
          if (existingRegistration) {
            console.log('✅ Service Worker already registered:', existingRegistration.scope);
          } else {
            // Register service worker manually since next-pwa auto-registration is not working
            const registration = await navigator.serviceWorker.register('/sw.js', { 
              scope: '/' 
            });
            console.log('✅ Service Worker registered manually:', registration.scope);
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
                    console.log('🔄 New content available, please refresh');
                    
                    if (confirm('새로운 업데이트가 있습니다. 페이지를 새로고침하시겠습니까?')) {
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
          }

        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      };

      // Register on load
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
        }
      });

      // Listen for service worker controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Controller changed - page will reload');
        window.location.reload();
      });

      // Check if controlling service worker exists
      if (navigator.serviceWorker.controller) {
        console.log('🎮 Service Worker controlling');
      }

      return () => {
        window.removeEventListener('load', registerSW);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}