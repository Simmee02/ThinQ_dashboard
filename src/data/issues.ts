// 이슈 예시 데이터(## 목업데이터)와 계산 (우선순위 점수, 일별 리뷰 수 생성, 화면 매핑)
// 실제 데이터를 붙일 때는 I 배열을 API 응답으로 바꾸면 됩니다.
export type Status = 'reopen' | 'new' | 'open' | 'watch' | 'done';
export type EventKind = 'detect' | 'mail' | 'fix' | 'reopen' | 'press' | 'hypo';
export type IssueEvent = [date: string, kind: EventKind, text: string, note?: string];
export interface Point { d: string; v: number }
export interface Dept { id: string; name: string; orphan?: boolean }

// 이슈 한 건. 데이터 파일에 적는 값 + 아래에서 계산해 붙이는 값 + 화면이 편집 중에 붙이는 값
export interface Issue {
  id: string; title: string; dept: string; area: string; owner?: string; status: Status;
  langs: string[]; topic: string; shape: [string, number][]; events: IssueEvent[]; why: string;
  range?: [string, string]; reviews: [string, number, string][]; situation?: string;
  // 계산되는 값
  series?: Point[]; total?: number; first?: string; trend?: number | null;
  // 화면에서 편집·첨부하면서 붙는 값
  [extra: string]: any;
}

const TODAY='2026-09-30';
const ME='김재민';
const DEPTS: Dept[]=[
  {id:'thinq',name:'THINQ 개발부'},
  {id:'aircon',name:'에어컨 개발부'},
  {id:'washer',name:'세탁기 개발부'},
  {id:'l10n',name:'번역부',orphan:true}
];
const ST: Record<Status,{t:string;r:number}>={reopen:{t:'재발',r:0},new:{t:'신규',r:1},open:{t:'진행',r:2},watch:{t:'관찰',r:3},done:{t:'해결됨',r:4}};
const EV: Record<EventKind,{c:string;t:string}>={detect:{c:'var(--warn)',t:'감지'},mail:{c:'var(--ink-2)',t:'알림'},fix:{c:'var(--good)',t:'해결 처리'},reopen:{c:'var(--crit)',t:'재발'},press:{c:'var(--ink-3)',t:'보도'},hypo:{c:'var(--line-2)',t:'가상'}};

// ## 목업데이터 · 이슈 목록
// 주제(topic)와 언어권은 VoC 분석의 v1 판정과 맞춰 두었습니다 (src/data/locus.ts 의 현지화 니즈 기준).
//   연결 끊김·재연동 = 앱 공통 오류 (한국·중동·튀르키예·인도네시아·헝가리·러시아)
//   세탁기·건조기 / 에어컨·냉장고 제어 / TV 제어·미러링 = 다국가 현지화 이슈 (대형가전형·TV중심형 시장)
//   TV-앱 연동·펌웨어(영어권) · 업데이트 후 고장(튀르키예) · 연결·기기 인식 실패(프랑스) · 대만 세탁기 = 현지화 이슈
const I: Issue[]=[
  {id:'VOC-231',title:'기기 연결이 끊긴 뒤 다시 연결되지 않음',dept:'thinq',area:'서버·인프라',owner:'김재민',status:'reopen',langs:['한국','중동(아랍어권)','튀르키예','인도네시아'],topic:'연결 끊김·재연동',
   shape:[['2026-09-01',3],['2026-09-02',38],['2026-09-06',22],['2026-09-12',14],['2026-09-18',4],['2026-09-24',3],['2026-09-27',19],['2026-09-30',31]],
   events:[['2026-09-02','detect','관련 리뷰 38건 증가가 감지됨','하루 평균 3건 → 38건'],['2026-09-02','mail','THINQ 개발부에 관련해서 메일이 발송됨',''],['2026-09-18','fix','담당자 해결 처리 완료','이후 하루 3~4건으로 감소'],['2026-09-27','reopen','해결 처리 후 다시 증가','중요도 올림 / 재알림 발송']],
   why:'해결 처리(9/18) 뒤 9일 만에 동일한 오류가 다시 보고되었습니다. 여러 그룹 시장에 공통으로 나타나는 앱 공통 오류입니다.',
   situation:'한국, 중동(아랍어권) 등 4개 언어권에서 기기 연결이 끊긴 뒤 재연동이 되지 않는 오류가 발생하고 있습니다.',
   mailBody:'09.02 이후 한국, 중동(아랍어권) 외 2개 언어권에서 기기 연결과 관련된 오류가 반복적으로 보고되었습니다.',
   reviews:[['KO',1,'공유기를 재시작하면 세탁기가 오프라인으로 뜨고 다시 안 붙는다'],['AR',1,'에어컨이 계속 연결 끊김으로 표시된다'],['TR',1,'기기가 계속 오프라인으로 보인다']]},
  {id:'VOC-238',title:'에어컨 원격 제어 응답이 늦음',dept:'aircon',area:'기기 연결·제어',owner:'박홍지',status:'new',langs:['네덜란드','폴란드','체코'],topic:'에어컨·냉장고 제어',
   shape:[['2026-09-01',1],['2026-09-26',2],['2026-09-28',9],['2026-09-30',17]],
   events:[['2026-09-28','detect','관련 리뷰 증가가 감지됨','하루 1~2건 → 9건'],['2026-09-30','mail','에어컨 개발부에 관련해서 메일이 발송됨','오늘 09:03']],
   why:'오늘 새로 생긴 이슈이고 사흘째 늘고 있습니다. 대형가전형 그룹 일부 시장에 함께 나타납니다.',
   situation:'네덜란드, 폴란드, 체코에서 앱으로 에어컨을 제어하면 반영이 1분 가까이 늦다는 불만이 늘고 있습니다.',
   reviews:[['NL',2,'앱에서 온도를 바꾸면 1분 뒤에야 반영된다'],['PL',1,'원격으로 끄기 버튼을 눌러도 반응이 없다'],['CS',2,'냉장고 온도 설정이 앱에 늦게 표시된다']]},
  {id:'VOC-235',title:'펌웨어 업데이트 후 TV가 앱과 연결되지 않음',dept:'thinq',area:'기기 연결·제어',status:'new',langs:['영어권'],topic:'TV-앱 연동·펌웨어',
   shape:[['2026-09-01',4],['2026-09-20',6],['2026-09-27',15],['2026-09-30',22]],
   events:[['2026-09-27','detect','관련 리뷰 증가가 감지됨','영어권에서만 두드러짐 (대형가전형 이웃 0/8)'],['2026-09-27','mail','THINQ 개발부에 관련해서 메일이 발송됨','']],
   why:'같은 그룹의 다른 시장에는 없는 현지화 이슈입니다. 영어권은 여러 나라가 섞여 있어 어느 나라 문제인지 먼저 확인해야 합니다.',
   situation:'영어권에서 TV 펌웨어 업데이트 뒤 앱이 TV를 찾지 못하거나 연결이 유지되지 않는다는 불만이 늘고 있습니다.',
   reviews:[['EN',1,'펌웨어 업데이트 후 TV가 앱과 연결되지 않는다'],['EN',1,'같은 와이파이인데도 앱이 TV를 못 찾는다']]},
  {id:'VOC-229',title:'앱 업데이트 후 기기 목록이 사라짐',dept:'thinq',area:'앱 개발',owner:'김재민',status:'open',langs:['튀르키예'],topic:'업데이트 후 고장',
   shape:[['2026-09-01',2],['2026-09-10',16],['2026-09-16',11],['2026-09-24',8],['2026-09-30',7]],
   events:[['2026-09-10','detect','관련 리뷰 급증이 감지됨','연결요청형 이웃 0/2'],['2026-09-10','mail','THINQ 개발부에 관련해서 메일이 발송됨',''],['2026-09-14','mail','담당자 확인 · 진행 중으로 변경','']],
   why:'진행 중이고 조금씩 줄고 있습니다. 같은 그룹의 브라질·중동에는 없는 튀르키예만의 현지화 이슈입니다.',
   situation:'최신 업데이트 이후 등록된 기기가 목록에서 사라지거나 다시 로그인해야 한다는 불만이 들어옵니다.',
   reviews:[['TR',1,'업데이트 후 에어컨이 목록에서 사라져서 앱을 지웠다'],['TR',2,'업데이트할 때마다 다시 로그인해야 한다']]},
  {id:'VOC-226',title:'현지 세탁기 모델 기능이 앱에 없음',dept:'l10n',area:'번역·현지화',status:'open',langs:['대만'],topic:'세탁기·건조기',
   shape:[['2026-09-01',2],['2026-09-15',3],['2026-09-30',4]],
   events:[['2026-08-21','detect','현지화 이슈로 분류','비교할 이웃 시장 없음'],['2026-08-21','mail','전담 조직이 없어 번역부·서비스 기획팀에 메일이 발송됨',''],['2026-09-03','mail','진행 중으로 변경','']],
   why:'대만에서만 두드러지는 현지화 이슈인데 해외 전담 조직이 없어 오래 남아 있습니다.',
   situation:'대만 판매 세탁기·건조기의 일부 코스와 기능이 앱에 표시되지 않습니다.',
   reviews:[['ZH',2,'대만 모델의 건조 코스가 앱에 나오지 않는다'],['ZH',1,'앱에서는 세탁기 기능 절반만 쓸 수 있다']]},
  {id:'VOC-233',title:'세탁 완료 알림이 오지 않음',dept:'thinq',area:'푸시·기기 데이터',owner:'심지영',status:'open',langs:['독일','프랑스','이탈리아','폴란드'],topic:'세탁기·건조기',
   shape:[['2026-09-01',2],['2026-09-12',9],['2026-09-20',7],['2026-09-30',6]],
   events:[['2026-09-12','detect','관련 리뷰 증가가 감지됨','대형가전형 이웃 6/8'],['2026-09-12','mail','THINQ 개발부에 관련해서 메일이 발송됨','']],
   why:'대형가전형 그룹 여러 시장에서 함께 나타나는 다국가 현지화 이슈입니다.',
   situation:'유럽 4개 시장에서 세탁이 끝나도 휴대폰 알림이 오지 않거나 늦게 옵니다.',
   reviews:[['DE',2,'세탁이 끝나도 휴대폰에 알림이 안 온다'],['FR',3,'알림이 한 시간 늦게 온다']]},
  {id:'VOC-224',title:'앱에서 기기를 찾지 못함',dept:'l10n',area:'번역·현지화',status:'new',langs:['프랑스'],topic:'연결·기기 인식 실패',
   shape:[['2026-09-01',1],['2026-09-22',2],['2026-09-28',5],['2026-09-30',8]],
   events:[['2026-09-28','detect','현지화 이슈로 분류','대형가전형 이웃 0/8'],['2026-09-28','mail','전담 조직이 없어 번역부·서비스 기획팀에 메일이 발송됨','']],
   why:'프랑스에서만 두드러지는 현지화 이슈인데 담당 조직이 없습니다.',
   situation:'프랑스에서 기기 등록 단계에서 앱이 기기를 찾지 못한다는 불만이 늘고 있습니다.',
   reviews:[['FR',1,'기기 검색 화면에서 아무것도 나오지 않는다'],['FR',2,'블루투스를 켜도 세탁기를 찾지 못한다']]},
  {id:'VOC-220',title:'세탁기 소음·진동 불만',dept:'washer',area:'제품(하드웨어)',owner:'임단하',status:'watch',langs:['러시아','독일'],topic:'세탁기·건조기',
   shape:[['2026-09-01',3],['2026-09-30',3]],
   events:[['2026-08-10','detect','제품 불만으로 분류','앱 문제가 아니라 세탁기 개발부로 전달']],
   why:'앱이 아닌 제품 문제라 관찰만 합니다. 세탁기 개발부에 주간 요약으로 전달됩니다.',
   situation:'탈수할 때 진동과 소음이 심하다는 제품 불만이 꾸준히 들어옵니다.',
   reviews:[['RU',2,'탈수할 때 진동이 너무 심하다']]},
  {id:'VOC-201',title:'2026년 7월 심야 접속 장애 (E1031)',dept:'thinq',area:'서버·인프라',status:'done',real:true,langs:['한국'],topic:'연결 끊김·재연동',
   range:['2026-07-01','2026-07-21'],
   shape:[['2026-07-01',4],['2026-07-06',5],['2026-07-07',140],['2026-07-08',210],['2026-07-09',20],['2026-07-11',6],['2026-07-12',260],['2026-07-13',520],['2026-07-14',380],['2026-07-15',90],['2026-07-17',8],['2026-07-21',5]],
   events:[['2026-07-07','detect','23:30 첫 장애 · 리뷰 급증','오류코드 E1031'],['2026-07-07','hypo','[가상] 에이전트가 있었다면: THINQ 개발부에 즉시 알림','재발 대비 가능'],['2026-07-12','reopen','23:10 재발 · 리뷰 급증 감지',''],['2026-07-13','reopen','23:10 다시 재발','LG: 서버 증설 후에도 무더위로 접속 폭증'],['2026-07-15','press','언론 보도 (에너지경제)',''],['2026-07-21','fix','리뷰 평소 수준으로 회복','']],
   why:'실제로 있었던 장애입니다. 첫 장애 뒤 두 번 더 재발했고, 첫날 담당 부서에 알림이 갔다면 대비할 시간이 있었습니다. 이 기간은 VoC 분석의 집중도 계산에서 제외했습니다.',
   situation:'7/7, 7/12, 7/13 심야에 E1031 오류로 앱 접속이 되지 않았습니다.',
   mailBody:'07.07 23:30 이후 한국에서 E1031 오류로 앱이 연결되지 않는다는 리뷰가 급증했습니다.',
   reviews:[['KO',1,'밤마다 앱이 E1031 오류로 연결되지 않는다'],['KO',1,'더운데 에어컨을 앱으로 켤 수가 없다']]},
  {id:'VOC-212',title:'TV 미러링이 자주 끊김',dept:'thinq',area:'기기 연결·제어',status:'done',langs:['헝가리','인도네시아'],topic:'TV 제어·미러링',
   range:['2026-03-20','2026-04-20'],
   shape:[['2026-03-20',0],['2026-03-29',12],['2026-04-02',9],['2026-04-10',2],['2026-04-20',0]],
   events:[['2026-03-29','detect','관련 리뷰 증가가 감지됨','TV중심형 이웃 1/2'],['2026-03-29','mail','THINQ 개발부에 관련해서 메일이 발송됨',''],['2026-04-10','fix','해결 처리','이후 감소']],
   why:'해결된 이슈입니다. 다시 늘면 재발로 올라옵니다.',
   situation:'TV중심형 그룹 시장에서 화면 미러링이 몇 분 만에 끊긴다는 불만이 있었습니다.',
   reviews:[['HU',2,'미러링이 5분도 안 돼 끊긴다'],['ID',1,'TV 화면 공유가 계속 멈춘다']]}
];

// daily series from piecewise shape
const D=864e5,t=(s: string)=>Date.parse(s),iso=(x: number)=>new Date(x).toISOString().slice(0,10);
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
I.forEach(it=>{
  const [a,b]=it.range||['2026-09-01',TODAY];
  const pts=it.shape.map(([d,v])=>[t(d),v] as [number,number]);
  it.series=[];
  for(let x=t(a);x<=t(b);x+=D){
    let v;const k=pts.findIndex(p=>p[0]>=x);
    if(k<=0)v=pts[Math.max(0,k)][1];
    else{const [x0,v0]=pts[k-1],[x1,v1]=pts[k];v=v0+(v1-v0)*(x-x0)/(x1-x0)}
    const exact=pts.find(p=>p[0]===x);
    if(!exact)v=v*(.8+rnd()*.4);
    it.series.push({d:iso(x),v:Math.max(0,Math.round(v))});
  }
  it.total=it.series.reduce((s,p)=>s+p.v,0);
  it.first=it.events[0][0];
  const s=it.series,last7=s.slice(-7).reduce((a,p)=>a+p.v,0),prev7=s.slice(-14,-7).reduce((a,p)=>a+p.v,0);
  it.trend=prev7?Math.round((last7-prev7)/prev7*100):null;
});
const need=(it: Issue)=>it.status!=='done';
const deptName=(id: string)=>DEPTS.find(d=>d.id===id)!.name;
const md=(d: string)=>`${+d.slice(5,7)}/${+d.slice(8,10)}`;

function prio(it: Issue){
  const base={reopen:60,new:40,open:20,watch:0,done:0}[it.status];
  const grow=Math.round(Math.min(Math.max(it.trend||0,0),300)/10);
  const lang=Math.min(it.langs.length*3,12);
  const orphan=it.dept==='l10n'?5:0;
  const score=base+grow+lang+orphan;
  const lv: [string,string]=score>=70?['p1','긴급']:score>=45?['p2','높음']:score>=25?['p3','보통']:['p4','낮음'];
  return {score,cls:lv[0],label:lv[1],parts:[[ST[it.status].t,base] as [string,number],['7일 증가',grow],['언어권 '+it.langs.length+'개',lang],...(orphan?[['담당 없음',orphan]]:[])]};
}
const fixDate=(it: Issue)=>{const f=[...it.events].reverse().find(e=>e[1]==='fix');return f?f[0]:''};

// ---------- 화면 증거 (목업: 자동 재현 연동 전) ----------
const SCREEN: Record<string,[string,number,string]>={'연결 끊김·재연동':['기기 연결 상태 화면',0,'특정 시간·기기·네트워크에서만 생겨 재현이 어렵습니다. 오류 화면만 캡처할 수 있습니다.'],
  '에어컨·냉장고 제어':['에어컨 제어 화면',0,'등록된 에어컨과 서버 상태가 필요해 조건부로만 재현됩니다.'],
  'TV-앱 연동·펌웨어':['TV 연결 화면',0,'해당 펌웨어의 TV가 있어야 재현됩니다.'],
  '업데이트 후 고장':['기기 목록 화면',1,'업데이트 직후 흐름이라 설치 상태에서 재현됩니다.'],
  '연결·기기 인식 실패':['기기 추가 · 검색 화면',1,'언어·지역 설정을 바꾸고 기기 추가 화면까지 이동하면 확인할 수 있습니다.'],
  'TV 제어·미러링':['TV 미러링 화면',0,'TV와 같은 네트워크가 필요해 화면 캡처만 가능합니다.'],
  '세탁기·건조기':['세탁기 제어 · 알림 설정 화면',0,'실제 세탁 완료 시점이나 현지 모델이 필요해 화면 캡처만으로는 부족합니다.']};
const LOCALE: Record<string,string>={'영어권':'en-US','스페인어권':'es-ES','브라질':'pt-BR','한국':'ko-KR','독일':'de-DE','프랑스':'fr-FR','이탈리아':'it-IT','네덜란드':'nl-NL','튀르키예':'tr-TR','러시아':'ru-RU','중동(아랍어권)':'ar-SA','폴란드':'pl-PL','체코':'cs-CZ','헝가리':'hu-HU','인도네시아':'id-ID','대만':'zh-TW','베트남':'vi-VN'};
const scr=(it: Issue)=>SCREEN[it.topic]||['관련 화면 (매핑 필요)',0,'이슈와 앱 화면 연결 정보가 아직 없습니다.'];

export { TODAY, ME, DEPTS, ST, EV, I, need, deptName, md, prio, fixDate, SCREEN, LOCALE, scr };
