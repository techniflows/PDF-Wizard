# PDF Wizard 🧙‍♂️

> 브라우저에서 100% 로컬로 작동하는 강력한 PDF 도구

## 📋 프로젝트 개요

PDF Wizard는 사용자의 브라우저에서 완전히 작동하는 프라이버시 중심의 PDF 처리 도구입니다. 서버로 파일을 업로드하지 않고 모든 작업이 로컬에서 처리되어 완벽한 보안과 프라이버시를 제공합니다.

**도메인**: [https://pdfwizard.dev](https://pdfwizard.dev)

## ✨ 주요 기능

### 구현 완료된 기능
- **PDF 병합**: 여러 PDF 파일을 하나로 결합
- **PDF 분할**: PDF의 개별 페이지를 분리하여 재구성
- **이미지 변환**: JPG, PNG, HEIC 등 다양한 이미지 형식을 PDF로 변환
- **페이지 재정렬**: 드래그 앤 드롭으로 페이지 순서 변경
- **페이지 그룹화**: 같은 PDF에서 분리된 페이지들을 그룹으로 관리
- **썸네일 미리보기**: 각 페이지의 고품질 썸네일 생성 및 표시
- **다국어 지원**: 한국어/영어 자동 감지 및 지원
- **PWA 지원**: 오프라인 모드 및 앱 설치 가능
- **다크 모드**: 시스템 테마에 따른 자동 전환

### 기술적 특징
- **100% 클라이언트 사이드 처리**: 서버 업로드 없이 브라우저에서 모든 작업 수행
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경 지원
- **터치 제스처 지원**: 모바일 환경에서 드래그 앤 드롭 최적화
- **Service Worker**: 오프라인 작동 및 캐싱 전략 구현
- **SEO 최적화**: 메타데이터, 구조화된 데이터, 사이트맵 제공

## 🚀 기술 스택

### 프레임워크 & 라이브러리
- **Next.js 15.5.2**: React 프레임워크 (Turbopack 지원)
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

## 📁 프로젝트 구조

```
PDF-Wizard/
├── app/                    # Next.js 앱 디렉토리
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── sitemap.xml/       # 동적 사이트맵 생성
├── components/            # React 컴포넌트
│   ├── PDFMerger.tsx     # 메인 PDF 처리 컴포넌트
│   ├── FileUploader.tsx  # 파일 업로드 UI
│   ├── FileItem.tsx      # 파일 아이템 컴포넌트
│   ├── PDFSettingsModal.tsx # PDF 설정 모달
│   ├── ZoomableThumbnail.tsx # 확대 가능한 썸네일
│   ├── PWAInstall.tsx    # PWA 설치 프롬프트
│   ├── OfflineIndicator.tsx # 오프라인 상태 표시
│   └── ServiceWorkerManager.tsx # SW 관리
├── utils/                 # 유틸리티 함수
│   ├── pdfUtils.ts       # PDF 처리 로직
│   ├── i18n.ts           # 다국어 지원
│   └── generateIcons.js  # 아이콘 생성 스크립트
└── public/               # 정적 파일
    ├── manifest.json     # PWA 매니페스트
    └── service-worker.js # 서비스 워커

```

## 🛠️ 개발 환경 설정

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

## 📈 개발 마일스톤

### Phase 1: 기본 기능 (완료)
- ✅ 기본 PDF 병합 기능
- ✅ 파일 업로드 인터페이스
- ✅ 드래그 앤 드롭 구현

### Phase 2: 고급 기능 (완료)
- ✅ PDF 페이지 분할
- ✅ 이미지를 PDF로 변환
- ✅ 페이지 재정렬
- ✅ 썸네일 미리보기

### Phase 3: PWA & 오프라인 (완료)
- ✅ Service Worker 구현
- ✅ 오프라인 모드 지원
- ✅ PWA 설치 가능
- ✅ 캐싱 전략 구현

### Phase 4: UX 개선 (완료)
- ✅ 모바일 드래그 앤 드롭 최적화
- ✅ 반응형 디자인 개선
- ✅ 다크 모드 지원
- ✅ 다국어 지원 (한국어/영어)

### Phase 5: SEO & 성능 (완료)
- ✅ 메타데이터 최적화
- ✅ 구조화된 데이터 추가
- ✅ 사이트맵 생성
- ✅ Vercel Analytics 통합

## 📝 TODO 리스트

### 단기 계획
- [ ] PDF 페이지 회전 기능
- [ ] PDF 압축 기능
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

## 🔒 보안 및 프라이버시

- **로컬 처리**: 모든 파일 처리가 사용자의 브라우저에서만 수행됩니다
- **서버 업로드 없음**: 파일이 서버로 전송되지 않습니다
- **데이터 수집 없음**: 사용자 파일이나 내용을 수집하지 않습니다
- **분석 도구**: Vercel Analytics를 통한 익명 사용 통계만 수집

## 🤝 기여하기

프로젝트에 기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 개발자

- **techniflows** - [https://www.techniflows.com](https://www.techniflows.com)

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움으로 만들어졌습니다:
- Next.js 팀의 훌륭한 프레임워크
- pdf-lib와 pdfjs-dist 개발자들
- @dnd-kit 팀의 드래그 앤 드롭 라이브러리
- 모든 오픈소스 기여자들

---

**최종 업데이트**: 2025년 9월 12일