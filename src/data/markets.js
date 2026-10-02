// 시장 현황 데이터 (예시 데이터: 데모 표 기준)
// M 한 줄 = [시장, 리뷰 적음 여부, 분석 리뷰 수, 집중 이슈, 국가별 이슈 집중도, 문제 유형 id, 불만 리뷰 비율]
export const V=[
  {id:'wide',name:'앱 공통 오류',c:'#e5384f',dc:'#ff6b7a',ink:'#fff',dink:'#1c1b20'},
  {id:'multi',name:'다국가 현지화 이슈',c:'#7c3aed',dc:'#a78bfa',ink:'#fff',dink:'#1c1b20'},
  {id:'local',name:'현지화 이슈',c:'#0e9aa7',dc:'#2dd4bf',ink:'#fff',dink:'#1c1b20'},
  {id:'none',name:'판정 보류',c:'none',dc:'none',ink:'#5f5c66',dink:'#aeaab6'}
];
export const M=[
  ['한국',0,2204,'연결 끊김·재연동',3.67,'wide',65.7],
  ['대만',1,227,'세탁기·건조기',3.16,'local',61.7],
  ['중동(아랍어권)',1,391,'연결 끊김·재연동',2.52,'wide',43.2],
  ['네덜란드',0,425,'에어컨·냉장고 제어',2.47,'multi',53.6],
  ['헝가리',1,262,'TV 제어·미러링',2.35,'multi',66.4],
  ['체코',1,336,'에어컨·냉장고 제어',1.99,'multi',60.4],
  ['폴란드',0,650,'에어컨·냉장고 제어',1.97,'multi',61.5],
  ['튀르키예',0,794,'연결 끊김·재연동',1.77,'wide',64.4],
  ['러시아',0,2049,'세탁기·건조기',1.62,'multi',62.3],
  ['이탈리아',0,845,'세탁기·건조기',1.57,'multi',59.5],
  ['프랑스',0,1037,'세탁기·건조기',1.55,'multi',50.9],
  ['베트남',1,345,'세탁기·건조기',1.55,'multi',51.3],
  ['독일',0,1327,'세탁기·건조기',1.43,'multi',70.7],
  ['인도네시아',1,341,'연결 끊김·재연동',1.43,'wide',40.5],
  ['영어권',0,13080,'TV-앱 연동·펌웨어',1.35,'local',64.6],
  ['브라질',0,5933,null,null,'none',47.9],
  ['스페인어권',0,5781,null,null,'none',49.0]
];
export const dark=()=>{const t=document.documentElement.getAttribute('data-theme');return t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)};
export const col=v=>dark()?v.dc:v.c, ink=v=>dark()?v.dink:v.ink;
export const fill=v=>v.id==='none'?'repeating-linear-gradient(135deg,var(--surface-2) 0 6px,var(--line-2) 6px 7px)':col(v);
