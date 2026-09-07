import { useSyncExternalStore } from 'react';

export type Language = 'ko' | 'en';

export interface Translations {
  title: string;
  subtitle: string;
  privacy: string;
  privacyDescription: string;
  featuresTitle: string;
  features: {
    split: {
      title: string;
      description: string;
    };
    convert: {
      title: string;
      description: string;
    };
    rearrange: {
      title: string;
      description: string;
    };
    merge: {
      title: string;
      description: string;
    };
  };
  upload: {
    dragDrop: string;
    clickToSelect: string;
    supportedFormats: string;
    maxSize: string;
    processing: string;
  };
  fileList: {
    filesReady: string;
    file: string;
    files: string;
    clearAll: string;
  };
  buttons: {
    downloadPdf: string;
    downloadAsImages: string;
    generating: string;
    install: string;
    notNow: string;
  };
  imageExport: {
    title: string;
    pagesInfo: string;
    formatLabel: string;
    pngDescription: string;
    jpgDescription: string;
    qualityLabel: string;
    qualityNames: { low: string; medium: string; high: string };
    qualityDetails: { low: string; medium: string; high: string };
    confirm: string;
    exporting: string;
  };
  install: {
    title: string;
    description: string;
    installMethod: string;
    installNow: string;
    notNow: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    iosStep3: string;
    iosNote: string;
    close: string;
    androidFallback: string;
  };
  settings: {
    title: string;
    pageSize: string;
    margin: string;
    pageSizes: {
      fit: string;
      fitDescription: string;
      a4: string;
      a4Description: string;
    };
    margins: {
      none: string;
      small: string;
      big: string;
    };
    compress: string;
    compressDescription: string;
    quality: string;
    qualityLow: string;
    qualityHigh: string;
    generate: string;
    cancel: string;
  };
  errors: {
    processingFailed: string;
    generationFailed: string;
    tryAgain: string;
  };
  serviceWorker?: {
    updatePrompt: string;
  };
  footer: {
    copyright: string;
  };
}

const translations: Record<Language, Translations> = {
  ko: {
    title: 'PDF 마법사 🪄',
    subtitle: 'PDF와 이미지를 위한 스위스 아미 나이프',
    privacy: '🌐 인터넷 없어도 사용 가능',
    privacyDescription: '파일이 서버로 전송되지 않습니다. 모든 처리는 브라우저에서 진행됩니다.',
    featuresTitle: 'PDF 마법사로 할 수 있는 일',
    features: {
      split: {
        title: '📑 PDF 분할',
        description: '개별 페이지 추출'
      },
      convert: {
        title: '🖼️ 이미지 변환',
        description: '이미지를 PDF로 변환'
      },
      rearrange: {
        title: '🔀 순서 변경',
        description: '드래그 앤 드롭으로 페이지 정렬'
      },
      merge: {
        title: '🎯 PDF 합치기',
        description: 'PDF와 이미지 결합'
      }
    },
    upload: {
      dragDrop: '파일을 여기에 드래그하거나',
      clickToSelect: '클릭하여 선택하세요',
      supportedFormats: '지원 형식: PDF, JPG, PNG, WebP 등',
      maxSize: '최대 크기: 50MB',
      processing: '파일 처리 중...'
    },
    fileList: {
      filesReady: '개 파일이 병합 준비됨',
      file: '파일',
      files: '파일',
      clearAll: '모두 지우기'
    },
    buttons: {
      downloadPdf: 'PDF 다운로드',
      downloadAsImages: '이미지로 다운로드',
      generating: 'PDF 생성 중...',
      install: '앱 설치',
      notNow: '나중에'
    },
    imageExport: {
      title: '이미지로 내보내기',
      pagesInfo: '{n}페이지가 ZIP 파일로 내보내집니다.',
      formatLabel: '이미지 형식',
      pngDescription: '무손실 품질, 큰 파일 크기',
      jpgDescription: '작은 파일 크기, 약간의 품질 손실',
      qualityLabel: '품질',
      qualityNames: { low: '낮음', medium: '보통', high: '높음' },
      qualityDetails: {
        low: '72 DPI - 웹용',
        medium: '150 DPI - 균형 잡힌 품질',
        high: '300 DPI - 인쇄용'
      },
      confirm: '이미지 내보내기',
      exporting: '내보내는 중...'
    },
    install: {
      title: 'PDF 마법사 설치하기',
      description: '홈 화면에 추가하여 앱처럼 사용하세요. 오프라인에서도 작동합니다!',
      installMethod: '설치 방법 보기',
      installNow: '지금 설치',
      notNow: '나중에',
      iosTitle: 'iOS에서 설치하기',
      iosStep1: 'Safari 브라우저 하단의 공유 버튼을 탭하세요',
      iosStep2: '"홈 화면에 추가"를 선택하세요',
      iosStep3: '오른쪽 상단의 "추가"를 탭하세요',
      iosNote: '참고: Safari 브라우저에서만 설치 가능합니다',
      close: '닫기',
      androidFallback: '홈 화면에 추가하려면:\n1. 브라우저 메뉴(⋮)를 탭하세요\n2. "홈 화면에 추가" 또는 "앱 설치"를 선택하세요'
    },
    settings: {
      title: 'PDF 설정',
      pageSize: '페이지 크기',
      margin: '여백',
      pageSizes: {
        fit: '이미지에 맞춤',
        fitDescription: '이미지와 동일한 크기',
        a4: 'A4',
        a4Description: '표준 A4 페이지 크기'
      },
      margins: {
        none: '여백 없음',
        small: '작게 (0.5인치)',
        big: '크게 (1인치)'
      },
      compress: '이미지 압축',
      compressDescription: '이미지를 JPEG로 재인코딩하여 용량을 줄입니다',
      quality: '압축 품질',
      qualityLow: '용량 작게',
      qualityHigh: '품질 높게',
      generate: 'PDF 생성',
      cancel: '취소'
    },
    errors: {
      processingFailed: '처리에 실패했습니다',
      generationFailed: 'PDF 생성 오류가 발생했습니다. 다시 시도해주세요.',
      tryAgain: '다시 시도해주세요'
    },
    serviceWorker: {
      updatePrompt: '새 버전이 사용 가능합니다. 업데이트하시겠습니까?'
    },
    footer: {
      copyright: '© 2026 주식회사 테크니플로우즈'
    }
  },
  en: {
    title: 'PDF Wizard 🪄',
    subtitle: 'Your Swiss Army Knife for PDFs & Images',
    privacy: '🌐 No Internet Required',
    privacyDescription: 'No files are sent to servers. All processing happens in your browser.',
    featuresTitle: 'What you can do with PDF Wizard',
    features: {
      split: {
        title: '📑 Split PDFs',
        description: 'Extract individual pages'
      },
      convert: {
        title: '🖼️ Convert Images',
        description: 'Turn images into PDFs'
      },
      rearrange: {
        title: '🔀 Rearrange',
        description: 'Drag & drop pages'
      },
      merge: {
        title: '🎯 Merge Files',
        description: 'Combine PDFs & images'
      }
    },
    upload: {
      dragDrop: 'Drag files here or',
      clickToSelect: 'click to select',
      supportedFormats: 'Supported: PDF, JPG, PNG, WebP, etc.',
      maxSize: 'Max size: 50MB',
      processing: 'Processing files...'
    },
    fileList: {
      filesReady: 'files ready to merge',
      file: 'file',
      files: 'files',
      clearAll: 'Clear All'
    },
    buttons: {
      downloadPdf: 'Download Merged PDF',
      downloadAsImages: 'Download as Images',
      generating: 'Generating PDF...',
      install: 'Install App',
      notNow: 'Not Now'
    },
    imageExport: {
      title: 'Export as Images',
      pagesInfo: '{n} pages will be exported as a ZIP file.',
      formatLabel: 'Image Format',
      pngDescription: 'Lossless quality, larger file size',
      jpgDescription: 'Smaller file size, slight quality loss',
      qualityLabel: 'Quality',
      qualityNames: { low: 'Low', medium: 'Medium', high: 'High' },
      qualityDetails: {
        low: '72 DPI - Web',
        medium: '150 DPI - Balanced',
        high: '300 DPI - Print'
      },
      confirm: 'Export Images',
      exporting: 'Exporting...'
    },
    install: {
      title: 'Install PDF Wizard',
      description: 'Add to home screen to use like an app. Works offline too!',
      installMethod: 'Show Install Method',
      installNow: 'Install Now',
      notNow: 'Not Now',
      iosTitle: 'Install on iOS',
      iosStep1: 'Tap the share button at the bottom of Safari browser',
      iosStep2: 'Select "Add to Home Screen"',
      iosStep3: 'Tap "Add" in the top right corner',
      iosNote: 'Note: Installation is only available in Safari browser',
      close: 'Close',
      androidFallback: 'To add to home screen:\n1. Tap the browser menu (⋮)\n2. Select "Add to Home Screen" or "Install App"'
    },
    settings: {
      title: 'PDF Settings',
      pageSize: 'Page Size',
      margin: 'Margin',
      pageSizes: {
        fit: 'Fit to Image',
        fitDescription: 'Same size as the image',
        a4: 'A4',
        a4Description: 'Standard A4 page size'
      },
      margins: {
        none: 'No Margin',
        small: 'Small (0.5 inch)',
        big: 'Big (1 inch)'
      },
      compress: 'Compress Images',
      compressDescription: 'Re-encode images as JPEG to reduce file size',
      quality: 'Compression Quality',
      qualityLow: 'Smaller size',
      qualityHigh: 'Higher quality',
      generate: 'Generate PDF',
      cancel: 'Cancel'
    },
    errors: {
      processingFailed: 'Failed to process',
      generationFailed: 'Error generating PDF. Please try again.',
      tryAgain: 'Please try again'
    },
    serviceWorker: {
      updatePrompt: 'New update available. Would you like to refresh the page?'
    },
    footer: {
      copyright: '© 2026 techniflows Inc.'
    }
  }
};

export function detectLanguage(): Language {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'en'; // Default to English on server
  }

  // Get browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // Check if Korean
  if (browserLang.startsWith('ko')) {
    return 'ko';
  }
  
  // Default to English for all other languages
  return 'en';
}

export function getTranslations(language?: Language): Translations {
  const lang = language || detectLanguage();
  return translations[lang];
}

const noopSubscribe = () => () => {};
const getServerLanguage = (): Language => 'en';

// Returns 'en' during SSR and hydration (matching the server HTML), then the
// browser-detected language once hydrated, avoiding hydration mismatches.
export function useLanguage(): Language {
  return useSyncExternalStore(noopSubscribe, detectLanguage, getServerLanguage);
}

// Hook for React components
export function useTranslations(language?: Language) {
  const detected = useLanguage();
  return getTranslations(language || detected);
}
