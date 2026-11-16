export const LOCALES = {
  en: {
    path: '/',
    htmlLang: 'en',
    ogLocale: 'en_US',
    label: 'English',
    manifest: '/manifest.json',
    ogImage: '/og-en.png',
  },
  ko: {
    path: '/ko',
    htmlLang: 'ko',
    ogLocale: 'ko_KR',
    label: '한국어',
    manifest: '/ko/manifest.json',
    ogImage: '/og-ko.png',
  },
} as const;

export type Language = keyof typeof LOCALES;

export const LANGUAGES = Object.keys(LOCALES) as Language[];
export const DEFAULT_LANGUAGE: Language = 'en';

export const FEATURE_KEYS = ['merge', 'split', 'rearrange', 'convert', 'toImages', 'compress'] as const;

const en = {
  meta: {
    title: 'Merge, Split & Compress PDFs in Your Browser | PDF Wizard',
    description:
      'Free PDF tool that runs in your browser. Merge PDFs and images, split and reorder pages, convert PDF to JPG or PNG, and compress files. Nothing is uploaded.',
  },
  brand: 'PDF Wizard',
  heading: 'Merge, split and compress PDFs in your browser',
  lead: 'Your files never leave this device. Everything runs locally and keeps working offline.',
  featuresTitle: 'What it does',
  features: {
    merge: { title: 'Merge PDF', description: 'Combine several PDFs and images into one PDF.' },
    split: { title: 'Split PDF', description: 'Keep only the pages you need and save them as a new PDF.' },
    rearrange: { title: 'Reorder pages', description: 'Drag pages into the order you want.' },
    convert: { title: 'Image to PDF', description: 'Turn JPG, PNG, WebP and HEIC images into a PDF.' },
    toImages: { title: 'PDF to image', description: 'Save PDF pages as JPG or PNG.' },
    compress: { title: 'Compress', description: 'Reduce the file size of PDFs and images.' },
  },
  common: {
    cancel: 'Cancel',
    close: 'Close',
  },
  offline: 'You are offline. Everything still works.',
  upload: {
    dragDrop: 'Drag files here or',
    clickToSelect: 'click to select',
    supportedFormats: 'Supported: PDF, JPG, PNG, WebP, HEIC',
    processing: 'Processing files...',
  },
  fileList: {
    count: { one: '{count} item', other: '{count} items' },
    countIncluded: '{included} of {total} included',
    invert: 'Invert selection',
    includeAll: 'Include all',
    clearAll: 'Clear all',
    page: 'Page {page}/{total}',
    fromFile: 'from {name}',
    reorder: 'Reorder {name}',
    exclude: 'Exclude {name}',
    include: 'Include {name} again',
    excluded: 'Excluded',
    closePreview: 'Close preview',
  },
  buttons: {
    downloadPdf: 'Download PDF',
    generating: 'Generating PDF...',
    downloadAsImages: 'Download as images',
    compressImages: 'Compress images',
    compressPdf: 'Compress PDF',
    groupLabel: 'Download and compress',
    noneIncluded: 'Include at least one item to download.',
  },
  install: {
    title: 'Install PDF Wizard',
    description: 'Add it to your home screen. It works offline.',
    installMethod: 'How to install',
    installNow: 'Install',
    notNow: 'Not now',
    iosTitle: 'Install on iOS',
    iosStep1: 'Tap the share button at the bottom of Safari.',
    iosStep2: 'Select "Add to Home Screen".',
    iosStep3: 'Tap "Add" in the top right corner.',
    iosNote: 'Installation is only available in Safari.',
    androidFallback:
      'To add to your home screen:\n1. Tap the browser menu (⋮)\n2. Select "Add to Home Screen" or "Install App"',
  },
  settings: {
    title: 'PDF settings',
    pageSize: 'Page size',
    margin: 'Margin',
    pageSizes: {
      a4: { label: 'A4', description: 'Standard A4 page' },
      fit: { label: 'Fit to image', description: 'Same page size as the image' },
    },
    margins: {
      none: 'None',
      small: 'Small (0.5 inch)',
      big: 'Big (1 inch)',
    },
    confirm: 'Generate PDF',
  },
  imageExport: {
    title: 'Export as images',
    format: 'Image format',
    quality: 'Quality',
    pngDescription: 'Lossless quality, larger file size',
    jpgDescription: 'Smaller file size, slight quality loss',
    qualityLow: 'Low',
    qualityLowDesc: '72 DPI, for web use',
    qualityMedium: 'Medium',
    qualityMediumDesc: '150 DPI, balanced quality',
    qualityHigh: 'High',
    qualityHighDesc: '300 DPI, for printing',
    singlePageNote: '1 page will be exported as an image file.',
    multiPageNote: '{count} pages will be exported as a ZIP file.',
    export: 'Export images',
    exporting: 'Exporting...',
    exportError: 'Error exporting images.',
  },
  compress: {
    imageTitle: 'Compress images',
    pdfTitle: 'Compress PDF',
    level: 'Compression level',
    levelLow: 'Low',
    levelLowDesc: 'Best quality, larger file size (~80% quality)',
    levelMedium: 'Medium',
    levelMediumDesc: 'Balanced quality and size (~60% quality)',
    levelHigh: 'High',
    levelHighDesc: 'Smallest file size, lower quality (~40% quality)',
    imageNote: { one: '{count} image will be compressed.', other: '{count} images will be compressed.' },
    pdfNote: { one: '{count} PDF page will be compressed.', other: '{count} PDF pages will be compressed.' },
    method: 'Method',
    methodKeepText: 'Keep text (recompress images only)',
    methodKeepTextDesc: 'Text stays selectable and searchable. Pages without images do not get smaller.',
    methodFlatten: 'Flatten pages to images',
    methodFlattenDesc: 'Smallest files for scans, but text can no longer be selected.',
    reduced: 'Reduced from {from} to {to} ({percent}% smaller).',
    nothingReduced: 'No images could be made smaller, so the file stays at {to}. For scans, try "{method}".',
    flattenGrew: 'Flattening made the file larger: {from} became {to}. Try "{method}" instead.',
    compress: 'Compress and download',
    compressing: 'Compressing...',
    compressError: 'Error compressing files.',
  },
  notFound: {
    title: 'Page not found',
    description: 'This address does not exist. The PDF tool is on the home page.',
    home: 'Go to PDF Wizard',
  },
  errors: {
    processingFailed: 'Could not process {name}. Please try again.',
    fileSkipped: 'Could not process {name}. It will be skipped.',
    generationFailed: 'Error generating PDF. Please try again.',
  },
  footer: {
    copyright: '© {year} techniflows',
  },
};

export type Translations = typeof en;

const ko: Translations = {
  meta: {
    title: 'PDF 합치기·분할·압축, 설치 없이 브라우저에서 | PDF 마법사',
    description:
      'PDF 합치기, 페이지 분할과 순서 변경, 이미지를 PDF로 변환, PDF를 JPG·PNG로 저장, 용량 압축까지. 파일을 서버에 올리지 않고 브라우저에서 바로 처리하는 무료 PDF 도구입니다.',
  },
  brand: 'PDF 마법사',
  heading: 'PDF 합치기, 분할, 압축을 브라우저에서 바로',
  lead: '파일은 서버로 전송되지 않습니다. 모든 작업이 내 기기에서 처리되고 오프라인에서도 동작합니다.',
  featuresTitle: '지원 기능',
  features: {
    merge: { title: 'PDF 합치기', description: '여러 PDF와 이미지를 하나의 PDF로 합칩니다.' },
    split: { title: 'PDF 분할', description: '필요한 페이지만 골라 새 PDF로 저장합니다.' },
    rearrange: { title: '페이지 순서 변경', description: '드래그해서 페이지 순서를 바꿉니다.' },
    convert: { title: '이미지를 PDF로', description: 'JPG, PNG, WebP, HEIC 이미지를 PDF로 변환합니다.' },
    toImages: { title: 'PDF를 이미지로', description: 'PDF 페이지를 JPG 또는 PNG로 저장합니다.' },
    compress: { title: '용량 압축', description: 'PDF와 이미지의 파일 크기를 줄입니다.' },
  },
  common: {
    cancel: '취소',
    close: '닫기',
  },
  offline: '오프라인 상태입니다. 모든 기능을 그대로 사용할 수 있습니다.',
  upload: {
    dragDrop: '파일을 여기에 드래그하거나',
    clickToSelect: '클릭하여 선택하세요',
    supportedFormats: '지원 형식: PDF, JPG, PNG, WebP, HEIC',
    processing: '파일 처리 중...',
  },
  fileList: {
    count: { one: '{count}개 항목', other: '{count}개 항목' },
    countIncluded: '{total}개 중 {included}개 포함',
    invert: '선택 반전',
    includeAll: '모두 포함',
    clearAll: '모두 지우기',
    page: '{page}/{total} 페이지',
    fromFile: '원본: {name}',
    reorder: '{name} 순서 변경',
    exclude: '{name} 제외',
    include: '{name} 다시 포함',
    excluded: '제외됨',
    closePreview: '미리보기 닫기',
  },
  buttons: {
    downloadPdf: 'PDF 다운로드',
    generating: 'PDF 생성 중...',
    downloadAsImages: '이미지로 다운로드',
    compressImages: '이미지 압축',
    compressPdf: 'PDF 압축',
    groupLabel: '다운로드 및 압축',
    noneIncluded: '다운로드하려면 항목을 하나 이상 포함하세요.',
  },
  install: {
    title: 'PDF 마법사 설치하기',
    description: '홈 화면에 추가하면 앱처럼 쓸 수 있고 오프라인에서도 동작합니다.',
    installMethod: '설치 방법 보기',
    installNow: '설치',
    notNow: '나중에',
    iosTitle: 'iOS에서 설치하기',
    iosStep1: 'Safari 하단의 공유 버튼을 탭하세요.',
    iosStep2: '"홈 화면에 추가"를 선택하세요.',
    iosStep3: '오른쪽 상단의 "추가"를 탭하세요.',
    iosNote: 'Safari에서만 설치할 수 있습니다.',
    androidFallback:
      '홈 화면에 추가하려면:\n1. 브라우저 메뉴(⋮)를 탭하세요\n2. "홈 화면에 추가" 또는 "앱 설치"를 선택하세요',
  },
  settings: {
    title: 'PDF 설정',
    pageSize: '페이지 크기',
    margin: '여백',
    pageSizes: {
      a4: { label: 'A4', description: '표준 A4 페이지' },
      fit: { label: '이미지에 맞춤', description: '이미지와 같은 페이지 크기' },
    },
    margins: {
      none: '없음',
      small: '작게 (0.5인치)',
      big: '크게 (1인치)',
    },
    confirm: 'PDF 만들기',
  },
  imageExport: {
    title: '이미지로 내보내기',
    format: '이미지 형식',
    quality: '품질',
    pngDescription: '무손실 품질, 큰 파일 크기',
    jpgDescription: '작은 파일 크기, 약간의 품질 손실',
    qualityLow: '낮음',
    qualityLowDesc: '72 DPI, 웹용',
    qualityMedium: '보통',
    qualityMediumDesc: '150 DPI, 균형 잡힌 품질',
    qualityHigh: '높음',
    qualityHighDesc: '300 DPI, 인쇄용',
    singlePageNote: '페이지 1개를 이미지 파일로 저장합니다.',
    multiPageNote: '페이지 {count}개를 ZIP 파일로 저장합니다.',
    export: '이미지 내보내기',
    exporting: '내보내는 중...',
    exportError: '내보내기 오류가 발생했습니다.',
  },
  compress: {
    imageTitle: '이미지 압축',
    pdfTitle: 'PDF 압축',
    level: '압축 수준',
    levelLow: '낮음',
    levelLowDesc: '최고 품질, 큰 파일 크기 (~80% 품질)',
    levelMedium: '보통',
    levelMediumDesc: '균형 잡힌 품질과 크기 (~60% 품질)',
    levelHigh: '높음',
    levelHighDesc: '가장 작은 파일 크기, 낮은 품질 (~40% 품질)',
    imageNote: { one: '{count}개의 이미지가 압축됩니다.', other: '{count}개의 이미지가 압축됩니다.' },
    pdfNote: { one: '페이지 {count}개를 압축합니다.', other: '페이지 {count}개를 압축합니다.' },
    method: '압축 방식',
    methodKeepText: '글자 유지 (이미지만 재압축)',
    methodKeepTextDesc: '글자를 그대로 선택하고 검색할 수 있습니다. 이미지가 없는 페이지는 용량이 줄지 않습니다.',
    methodFlatten: '페이지를 이미지로 변환',
    methodFlattenDesc: '스캔 문서는 용량이 가장 많이 줄지만, 글자를 선택할 수 없게 됩니다.',
    reduced: '{from}에서 {to}로 줄었습니다 ({percent}% 감소).',
    nothingReduced: '더 줄일 수 있는 이미지가 없어 용량이 {to} 그대로입니다. 스캔 문서라면 "{method}" 방식을 써 보세요.',
    flattenGrew: '이미지로 바꾸니 {from}에서 {to}로 오히려 커졌습니다. "{method}" 방식을 써 보세요.',
    compress: '압축 및 다운로드',
    compressing: '압축 중...',
    compressError: '압축 오류가 발생했습니다.',
  },
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    description: '없는 주소입니다. PDF 도구는 첫 화면에 있습니다.',
    home: 'PDF 마법사로 이동',
  },
  errors: {
    processingFailed: '{name} 파일을 처리하지 못했습니다. 다시 시도해주세요.',
    fileSkipped: '{name} 파일을 처리하지 못해 건너뜁니다.',
    generationFailed: 'PDF 생성 오류가 발생했습니다. 다시 시도해주세요.',
  },
  footer: {
    copyright: '© {year} 테크니플로우즈(techniflows)',
  },
};

const translations: Record<Language, Translations> = { en, ko };

export function getTranslations(language: Language): Translations {
  return translations[language];
}

export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export function formatCount(forms: { one: string; other: string }, count: number): string {
  return format(count === 1 ? forms.one : forms.other, { count });
}

export function formatFileSize(bytes: number): string {
  const megabyte = 1024 * 1024;
  return bytes < megabyte ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / megabyte).toFixed(1)} MB`;
}
