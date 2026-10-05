// 시장 현황 데이터 · v1 분석 결과(장애 구간 2026-07-01~08-01 제외)
// M 한 줄 = [시장, 리뷰 적음 여부, 분석 리뷰 수, 1순위 장벽 후보, 국가별 이슈 집중도, 판정 id, 불만 리뷰 비율]
export interface Verdict { id: string; name: string; desc: string; c: string; dc: string; ink: string; dink: string }
export type MarketRow = [name: string, small: number, n: number, topic: string | null, lift: number | null, verdict: string, rate: number];

// 판정 규칙: 국가별 이슈 집중도 1.3 이상 + 잔차 2 이상인 이슈만 장벽 후보로 보고, 같은 이슈가 다른 시장에도 있는지로 범위를 나눕니다
export const V: Verdict[]=[
  {id:'wide',name:'광역 공통',desc:'2개 이상 그룹에서 과반 시장에 나타남 · 본사 단위 검토',c:'#e5384f',dc:'#ff6b7a',ink:'#fff',dink:'#1c1b20'},
  {id:'group',name:'그룹 공통',desc:'같은 그룹 이웃 시장 절반 이상에 나타남 · 제품군 단위 검토',c:'#7c3aed',dc:'#a78bfa',ink:'#fff',dink:'#1c1b20'},
  {id:'part',name:'부분 공통',desc:'같은 그룹 이웃 시장 25~50%에 나타남 · 몇 개 시장 묶음',c:'#b197f0',dc:'#c4b5fd',ink:'#1c1b20',dink:'#1c1b20'},
  {id:'special',name:'시장 특이 불만 후보',desc:'같은 그룹 이웃 시장 25% 미만 · 원인 검수 후 확정',c:'#0e9aa7',dc:'#2dd4bf',ink:'#fff',dink:'#1c1b20'},
  {id:'solo',name:'단독 시장',desc:'비교할 이웃 시장이 없음 · 규칙 판정 불가',c:'#c27c0e',dc:'#f5b84a',ink:'#fff',dink:'#1c1b20'},
  {id:'none',name:'장벽 후보 없음',desc:'판정 기준을 넘는 이슈가 없음',c:'none',dc:'none',ink:'#5f5c66',dink:'#aeaab6'}
];
export const M: MarketRow[]=[
  ["한국", 0, 2204, "연결 끊김·재연동", 3.67, "wide", 65.7],
  ["대만", 1, 227, "세탁기·건조기", 3.16, "solo", 61.7],
  ["중동(아랍어권)", 1, 391, "연결 끊김·재연동", 2.52, "wide", 43.2],
  ["네덜란드", 0, 425, "에어컨·냉장고 제어", 2.47, "part", 53.6],
  ["헝가리", 1, 262, "TV 제어·미러링", 2.35, "group", 66.4],
  ["체코", 1, 336, "에어컨·냉장고 제어", 1.99, "part", 60.4],
  ["폴란드", 0, 650, "에어컨·냉장고 제어", 1.97, "part", 61.5],
  ["튀르키예", 0, 794, "연결 끊김·재연동", 1.77, "wide", 64.4],
  ["러시아", 0, 2049, "세탁기·건조기", 1.62, "group", 62.3],
  ["이탈리아", 0, 845, "세탁기·건조기", 1.57, "group", 59.5],
  ["프랑스", 0, 1037, "세탁기·건조기", 1.55, "group", 50.9],
  ["베트남", 1, 345, "세탁기·건조기", 1.55, "group", 51.3],
  ["독일", 0, 1327, "세탁기·건조기", 1.43, "group", 70.7],
  ["인도네시아", 1, 341, "연결 끊김·재연동", 1.43, "wide", 40.5],
  ["영어권", 0, 13080, "TV-앱 연동·펌웨어", 1.35, "special", 64.6],
  ["브라질", 0, 5933, null, null, "none", 47.9],
  ["스페인어권", 0, 5781, null, null, "none", 49.0]
];
export const dark=()=>{const t=document.documentElement.getAttribute('data-theme');return t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)};
export const col=v=>dark()?v.dc:v.c, ink=v=>dark()?v.dink:v.ink;
export const fill=v=>v.id==='none'?'repeating-linear-gradient(135deg,var(--surface-2) 0 6px,var(--line-2) 6px 7px)':col(v);
