# ThinQ VOC 에이전트 대시보드

빌드 도구 없이 동작하는 정적 웹 프로젝트입니다. HTML 조각 + CSS + ES 모듈로 나뉘어 있고, 화면 이동은 주소의 `#` 뒤 값으로 합니다.

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
vite.config.js
src/
  main.js                  시작점: 스타일 → 화면 조각 넣기 → 화면 모듈 → 라우터 시작
  mount.js                 화면 HTML 조각을 문서에 넣음 (main.js에서 가장 먼저 import)
  router.js                해시 라우터 (register / go / setParam / start)
  pages/                   화면별 HTML 조각 (문구·구조는 여기서 고칩니다)
    issues.html            VoC 이슈 관리 + 상세 Drawer
    trend.html             글로벌 VoC 동향
    market.html            글로벌 시장 분석
    report.html            보고서/조치 관리
  views/                   화면별 동작
    issues.js  report.js  trend.js  market.js  market-overview.js
  data/
    issues.js              이슈 예시 데이터, 우선순위 점수, 화면 매핑  ← 실제 API로 바꿀 곳
    markets.js             시장 현황 예시 데이터                       ← 실제 API로 바꿀 곳
  shared/ui.js             $, esc, toast, 복사 도우미
  styles/                  main.js에서 이 순서로 불러옵니다 (겹치는 규칙의 우선순위가 순서로 정해짐)
    tokens.css  fonts.css  base.css  trend.css  market.css  issues.css  report.css  a4.css
  assets/fonts/PretendardSubset.woff2   화면 글자 + 한글 2,350자 서브셋
```

## 화면을 하나 추가하려면

1. `src/pages/새화면.html` 조각을 만들고 바깥 요소에 `id="view-xx" hidden`을 줍니다.
2. `src/views/새화면.js`를 만들고 `export function onShow(param) {}`를 둡니다.
3. `src/mount.js`에 조각을 `?raw`로 import 해 넣고 `VIEWS`에 `['주소', 'view-xx', '탭 id']`를 추가합니다. `src/main.js`에서 모듈을 import 하고 `onShow` 목록에 넣습니다.
4. `index.html` 사이드바에 `<button role="tab" id="탭 id" data-route="주소">`를 추가합니다.

## 참고

- 모든 숫자·리뷰 문구·조직도는 예시 데이터입니다. 실제 사례는 2026년 7월 심야 접속 장애(E1031) 날짜·시각뿐입니다.
- 화면 상태(담당자 지정, 메모 등)는 새로고침하면 처음으로 돌아갑니다. 저장하려면 서버 API가 필요합니다.
- 코드는 단일 HTML에서 동작을 바꾸지 않고 옮긴 것이라 한 줄이 긴 곳이 있습니다. Prettier로 한 번 정리하는 걸 권합니다.
