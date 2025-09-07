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
    generating: string;
    install: string;
    notNow: string;
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
      a4: string;
    };
    margins: {
      none: string;
      small: string;
      big: string;
    };
    confirm: string;
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
      generating: 'PDF 생성 중...',
      install: '앱 설치',
      notNow: '나중에'
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
        a4: 'A4'
      },
      margins: {
        none: '없음',
        small: '작게 (0.5인치)',
        big: '크게 (1인치)'
      },
      confirm: '확인',
      cancel: '취소'
    },
    errors: {
      processingFailed: '처리에 실패했습니다',
      generationFailed: 'PDF 생성 오류가 발생했습니다. 다시 시도해주세요.',
      tryAgain: '다시 시도해주세요'
    },
    serviceWorker: {
      updatePrompt: '새로운 업데이트가 있습니다. 페이지를 새로고침하시겠습니까?'
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
      generating: 'Generating PDF...',
      install: 'Install App',
      notNow: 'Not Now'
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
        a4: 'A4'
      },
      margins: {
        none: 'None',
        small: 'Small (0.5 inch)',
        big: 'Big (1 inch)'
      },
      confirm: 'Confirm',
      cancel: 'Cancel'
    },
    errors: {
      processingFailed: 'Failed to process',
      generationFailed: 'Error generating PDF. Please try again.',
      tryAgain: 'Please try again'
    },
    serviceWorker: {
      updatePrompt: 'New update available. Would you like to refresh the page?'
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

// Hook for React components
export function useTranslations(language?: Language) {
  return getTranslations(language);
}
