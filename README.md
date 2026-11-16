# PDF Wizard

> 브라우저에서 100% 로컬로 작동하는 강력한 PDF 도구

## 프로젝트 개요

PDF Wizard는 사용자의 브라우저에서 완전히 작동하는 프라이버시 중심의 PDF 처리 도구입니다. 서버로 파일을 업로드하지 않고 모든 작업이 로컬에서 처리되어 완벽한 보안과 프라이버시를 제공합니다.

**도메인**: [https://pdfwizard.dev](https://pdfwizard.dev)

## 주요 기능

### 구현 완료된 기능
- **PDF 병합**: 여러 PDF와 이미지를 하나의 PDF로 결합
- **PDF 분할**: PDF를 페이지 단위로 나누고 필요한 페이지만 새 PDF로 저장
- **페이지 제외와 선택 반전**: 항목마다 제외 버튼으로 결과에서 빼거나 다시 포함하고, 선택 반전과 모두 포함으로 한 번에 변경
- **이미지를 PDF로**: JPG, PNG, WebP, HEIC 이미지를 PDF로 변환
- **PDF를 이미지로**: PDF 페이지를 JPG 또는 PNG로 저장 (여러 장이면 ZIP)
- **용량 압축**: PDF와 이미지의 파일 크기 축소
- **페이지 재정렬**: 드래그 앤 드롭 또는 키보드로 순서 변경
- **썸네일 미리보기**: 각 페이지의 썸네일 표시와 확대
- **언어별 주소**: 영어는 `/`, 한국어는 `/ko`에서 제공하며 주소마다 메타데이터, 웹 앱 매니페스트, 공유 이미지를 따로 가짐
- **404 응답**: 없는 주소는 해당 언어의 `lang` 속성을 가진 HTML 문서와 404 상태로 응답
- **PWA 지원**: 오프라인 동작과 앱 설치
- **다크 모드**: 시스템 테마에 따라 전환

### 기술적 특징
- **100% 클라이언트 사이드 처리**: 서버 업로드 없이 브라우저에서 모든 작업 수행
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경 지원
- **터치 제스처 지원**: 모바일 환경에서 드래그 앤 드롭 최적화
- **Service Worker**: 오프라인 작동 및 캐싱 전략 구현
- **SEO 최적화**: 메타데이터, 구조화된 데이터, 사이트맵 제공

## 기술 스택

### 프레임워크 & 라이브러리
- **Next.js 15.5.9**: React 프레임워크 (Turbopack 지원)
- **React 19.1.0**: UI 라이브러리
- **TypeScript 5**: 타입 안정성
- **Tailwind CSS 4**: 유틸리티 기반 스타일링

### PDF 처리
- **pdf-lib 1.17.1**: PDF 생성 및 조작
- **pdfjs-dist 5.4.149**: PDF 렌더링 및 파싱

### UI/UX
- **@dnd-kit**: 드래그 앤 드롭 기능 구현
  - @dnd-kit/core 6.3.1
  - @dnd-kit/sortable 10.0.0
  - @dnd-kit/utilities 3.2.2

### 기타
- **heic2any 0.0.4**: HEIC 이미지 변환
- **next-pwa 5.6.0**: PWA 기능 구현
- **@vercel/analytics 1.5.0**: 사용 분석

## 프로젝트 구조

```
PDF-Wizard/
├── app/                        # Next.js 앱 디렉토리
│   ├── (en)/                   # 영어 루트 레이아웃 (/)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── manifest.json/route.ts  # 영어 매니페스트 (/manifest.json)
│   │   └── [...rest]/route.ts      # 영어 404 응답
│   ├── (ko)/ko/                # 한국어 루트 레이아웃 (/ko)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── manifest.json/route.ts  # 한국어 매니페스트 (/ko/manifest.json)
│   │   └── [...rest]/route.ts      # 한국어 404 응답
│   ├── globals.css             # 전역 스타일
│   └── sitemap.ts              # 사이트맵 (/sitemap.xml)
├── components/                 # React 컴포넌트
│   ├── RootShell.tsx           # html/body, 폰트, JSON-LD, Analytics (서버)
│   ├── HomePage.tsx            # 헤더, 본문, 기능 목록, 푸터 (서버)
│   ├── LanguageProvider.tsx    # 언어 컨텍스트와 useTranslations
│   ├── LanguageSwitch.tsx      # 언어 전환 링크, 브라우저 언어 리디렉션
│   ├── PDFMerger.tsx           # 파일 목록 상태, 병합/내보내기/압축 작업
│   ├── FileUploader.tsx        # 파일 업로드 UI
│   ├── FileList.tsx            # 드래그 정렬 목록
│   ├── FileItem.tsx            # 목록 항목, 제외 버튼
│   ├── ZoomableThumbnail.tsx   # 확대 가능한 썸네일
│   ├── Modal.tsx               # 공용 모달 셸, 포커스 관리
│   ├── RadioGroup.tsx          # 옵션 테이블 기반 라디오 그룹
│   ├── PDFSettingsModal.tsx    # PDF 설정 모달
│   ├── ImageExportModal.tsx    # 이미지 내보내기 모달
│   ├── CompressModal.tsx       # 압축 모달
│   ├── PWAInstall.tsx          # PWA 설치 안내
│   ├── OfflineIndicator.tsx    # 오프라인 상태 표시
│   ├── ServiceWorkerRegistrar.tsx # 서비스 워커 등록
│   └── styles.ts               # 공용 버튼/링크 클래스
├── utils/                      # 유틸리티 함수
│   ├── i18n.ts                 # 언어 레지스트리와 번역 사전
│   ├── seo.ts                  # 메타데이터, JSON-LD
│   ├── manifest.ts             # 언어별 웹 앱 매니페스트 생성
│   ├── notFoundHtml.ts         # 언어별 404 HTML 문서 생성
│   ├── pdfUtils.ts             # PDF 렌더링, 이미지 변환, 압축
│   ├── download.ts             # 파일/ZIP 다운로드
│   ├── generateIcons.js        # 아이콘 생성 스크립트
│   └── generateOgImages.js     # 공유 이미지 생성 스크립트
└── public/                     # 정적 파일
    ├── og-en.png, og-ko.png    # 공유 이미지 (1200x630)
    ├── offline.html            # 오프라인 폴백 페이지
    └── robots.txt
```

공유 이미지의 문구는 `utils/i18n.ts`에서 읽습니다. 제목을 바꾼 뒤에는 `node utils/generateOgImages.js`를 다시 실행합니다. 글자는 실행하는 기기의 폰트로 그려지므로 한글 폰트가 있는 환경에서 실행해야 합니다.

## 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 실행
npm run lint
```

### 환경 변수
특별한 환경 변수 설정이 필요하지 않습니다. 모든 기능이 클라이언트 사이드에서 작동합니다.

## 개발 마일스톤

### Phase 1: 기본 기능 (완료)
- 기본 PDF 병합 기능
- 파일 업로드 인터페이스
- 드래그 앤 드롭 구현

### Phase 2: 고급 기능 (완료)
- PDF 페이지 분할
- 이미지를 PDF로 변환
- 페이지 재정렬
- 썸네일 미리보기

### Phase 3: PWA & 오프라인 (완료)
- Service Worker 구현
- 오프라인 모드 지원
- PWA 설치 가능
- 캐싱 전략 구현

### Phase 4: UX 개선 (완료)
- 모바일 드래그 앤 드롭 최적화
- 반응형 디자인 개선
- 다크 모드 지원
- 다국어 지원 (한국어/영어)

### Phase 5: SEO & 성능 (완료)
- 메타데이터 최적화
- 구조화된 데이터 추가
- 사이트맵 생성
- Vercel Analytics 통합

## TODO 리스트

### 단기 계획
- [ ] PDF 페이지 회전 기능
- [ ] 워터마크 추가 기능
- [ ] 배치 처리 기능
- [ ] 더 많은 언어 지원 (일본어, 중국어 등)

### 중기 계획
- [ ] PDF 암호화/복호화
- [ ] PDF 양식 채우기
- [ ] OCR 텍스트 인식
- [ ] PDF to Word/Excel 변환
- [ ] 클라우드 저장소 연동 (선택적)

### 장기 계획
- [ ] 협업 기능 (링크 공유)
- [ ] 템플릿 시스템
- [ ] API 제공
- [ ] 브라우저 확장 프로그램
- [ ] 데스크톱 앱 (Electron)

## 보안 및 프라이버시

- **로컬 처리**: 모든 파일 처리가 사용자의 브라우저에서만 수행됩니다
- **서버 업로드 없음**: 파일이 서버로 전송되지 않습니다
- **데이터 수집 없음**: 사용자 파일이나 내용을 수집하지 않습니다
- **분석 도구**: Vercel Analytics를 통한 익명 사용 통계만 수집

## 기여하기

프로젝트에 기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 개발자

- **techniflows** - [https://www.techniflows.com](https://www.techniflows.com)

## 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움으로 만들어졌습니다:
- Next.js 팀의 훌륭한 프레임워크
- pdf-lib와 pdfjs-dist 개발자들
- @dnd-kit 팀의 드래그 앤 드롭 라이브러리
- 모든 오픈소스 기여자들

---

**최종 업데이트**: 2025년 9월 12일