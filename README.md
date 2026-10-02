# ThinQ VOC 에이전트 대시보드

## 실행

```bash
npm install
npm run dev        # 개발 서버 (저장하면 바로 반영)
npm run build      # dist/ 에 배포용 파일 생성
npm run preview    # 빌드 결과 미리 보기
```

`dist/`는 정적 파일이라 아무 웹 서버(GitHub Pages, Netlify, S3 등)에 올리면 됩니다. 상대 경로로 빌드하므로 하위 폴더에 올려도 됩니다. 다만 ES 모듈이라 `dist/index.html`을 더블클릭으로 열 수는 없습니다.

## 주소(라우트)

| 주소 | 화면 | 사이드바 |
|---|---|---|
| `#issues` | VoC 이슈 관리 | VoC 이슈 관리 |
| `#issues.VOC-231` | 위 화면 + 해당 이슈 상세(Drawer) 열림 | |
| `#trend` | 글로벌 VoC 동향 (별점 추이 + 시장 현황) | 글로벌 VoC 동향 |
| `#market` / `#market.3` | 글로벌 시장 분석 (숫자 = 시장 목록 순번, 0부터) | 글로벌 시장 분석 |
| `#report` | 보고서/조치 관리 | 보고서/조치 관리 |

`/` 대신 `.`을 쓰는 이유: Claude 공유 링크에서는 영문·숫자·`. _ ~ -`로만 된 해시만 페이지에 전달됩니다. 일반 서버에 올릴 때는 그대로 써도 됩니다.

## 폴더 구조

```
index.html                 앱 뼈대: 사이드바, 상단바, 화면이 들어갈 <main id="views">
vite.config.ts
src/
  main.ts                  시작점: 스타일 → 화면 조각 넣기 → 화면 모듈 → 라우터 시작
  mount.ts                 화면 HTML 조각을 문서에 넣음 (main.ts에서 가장 먼저 import)
  router.ts                해시 라우터 (register / go / setParam / start)
  pages/                   화면별 HTML 조각 (문구·구조는 여기서 고칩니다)
    issues.html            VoC 이슈 관리 + 상세 Drawer
    trend.html             글로벌 VoC 동향
    market.html            글로벌 시장 분석
    report.html            보고서/조치 관리
  views/                   화면별 동작
    issues.ts  report.ts  trend.ts  market.ts  market-overview.ts
  data/
    issues.ts              이슈 예시 데이터, 우선순위 점수, 화면 매핑  ← 실제 API로 바꿀 곳
    markets.ts             시장 현황 예시 데이터                       ← 실제 API로 바꿀 곳
  shared/ui.ts             $, esc, toast, 복사 도우미
  styles/                  main.ts에서 이 순서로 불러옵니다 (겹치는 규칙의 우선순위가 순서로 정해짐)
    tokens.css  fonts.css  base.css  trend.css  market.css  issues.css  report.css  a4.css
  assets/fonts/PretendardSubset.woff2   화면 글자 + 한글 2,350자 서브셋
```
