'use client';

import PDFMerger from '@/components/PDFMerger';
import SystemTheme from '@/components/SystemTheme';
import PWAInstall from '@/components/PWAInstall';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useTranslations, detectLanguage } from '@/utils/i18n';

export default function Home() {
  const t = useTranslations();
  const language = detectLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <OfflineIndicator />
      <SystemTheme />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            {t.title}
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
            {t.subtitle}
          </p>
          
          {/* Privacy badge - compact version */}
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
            <span className="text-green-600 dark:text-green-400 font-semibold text-sm">{t.privacy}</span>
          </div>
        </div>
        
        <PDFMerger />
        
        {/* Feature cards moved below upload area */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 text-center mb-6">
            {t.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t.features.split.title}</span>
              <div className="text-gray-600 dark:text-gray-400 mt-1">{t.features.split.description}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t.features.convert.title}</span>
              <div className="text-gray-600 dark:text-gray-400 mt-1">{t.features.convert.description}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t.features.rearrange.title}</span>
              <div className="text-gray-600 dark:text-gray-400 mt-1">{t.features.rearrange.description}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t.features.merge.title}</span>
              <div className="text-gray-600 dark:text-gray-400 mt-1">{t.features.merge.description}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
            <a 
              href="https://www.techniflows.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {t.footer.copyright}
            </a>
          </p>
        </div>
      </footer>
      
      <PWAInstall />
    </main>
  );
}
