// VoC 분석(#voc) · 전체(기존 글로벌 VoC 동향) / 국가별 상세(사용 현황 → 현지화 니즈 → 현지화 기회 → 에이전트 제안)
import { M, V, fill, col } from '../data/markets';
import { D, STAGE_OF, ATTR, REV, FEAT, FEAT_AVG, type Cand } from '../data/locus';
import { OPP } from '../data/opportunity';
import { USAGE, ratio, RATIO_AVG } from '../data/usage';
import { GOALS, suggest, type Goal } from '../data/agent';
import { esc, copyText, AGENT_ICON } from '../shared/ui';
import { go, setParam, currentRoute } from '../router';
import { setMarket } from './trend';

const BULB=AGENT_ICON;
const tip=(t: string)=>`<div class="mk-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> ${t}</span></div>`;
let cur=0,sel=0,goal: Goal='retain';
const $=(id: string)=>document.getElementById(id)!;
const vOf=(id: string)=>V.find(x=>x.id===id)!;
const pill=v=>`<span class="pill" style="${v.id==='none'?'background:transparent;border-color:var(--line-2);color:var(--ink-3)':`background:color-mix(in oklab, ${col(v)} 16%, var(--surface));color:var(--ink)`}"><i style="background:${fill(v)}"></i>${v.name}</span>`;

// 현지화 니즈마다 함께 봐야 할 다른 가능성 (기각 = 데이터로 이미 배제, 미확인 = 추가 확인 필요)
function alts(c: Cand, name: string){
  const d=D[name],small=M[cur][1];
  const a: [string,string][]=[];
  const byV={
    wide:'여러 시장에 공통으로 나타남 → 이 시장의 현지 요인보다 앱·서버 공통 원인일 가능성이 큼',
    group:`같은 그룹(${d.group}) 시장에도 나타남 → 그룹의 제품 구성(많이 쓰는 가전) 차이일 수 있음`,
    part:'일부 이웃 시장에도 나타남 → 몇 개 시장 묶음의 공통 원인일 수 있음',
    special:'이웃 시장에는 드묾 → 다만 쏠림만으로 현지화 원인을 확정할 수 없어 원문 검수가 필요함',
    solo:'비교할 이웃 시장이 없음 → 공통 문제인지 이 시장만의 문제인지 규칙으로 판단할 수 없음',
  };
  a.push(['open',byV[c.k]]);
  if(d.attr==='lang')a.push(['open',`${name} 리뷰는 여러 나라가 섞여 있음 → 특정 국가 문제로 볼 근거가 없음`]);
  if(small)a.push(['open','분석 리뷰가 적음 → 국가별 이슈 집중도가 크게 흔들릴 수 있음']);
  return a;
}

// 언어권 드롭다운 (시장 목록 대신)
function list(){
  const box=$('mk-select') as HTMLSelectElement;
  if(!box.options.length){
    box.innerHTML=M.map((m,i)=>`<option value="${i}">${m[0]}</option>`).join('');
    box.onchange=()=>go('voc',box.value);
  }
  box.value=String(cur);
}

function draw(){
  if(currentRoute()==='voc')setParam(String(cur));
  list();
  setMarket(M[cur][0]);
  const [name,small,n,,,vid]=M[cur],v=vOf(vid),d=D[name],cands=d.cands,at=ATTR[d.attr];
  const c=cands[sel]||null;
  $('dt-name').textContent=name;$('dt-pill').innerHTML='';
  $('dt-attr').innerHTML=`<span class="attr ${d.attr}">${at.name}</span>`;
  $('dt-small').innerHTML=small?'<span class="small-badge">리뷰 적음</span>':'';

  // ThinQ 사용 현황 (## 목업데이터: src/data/usage.ts)
  const u=USAGE[name],r=ratio(u)*100,avg=RATIO_AVG*100,low=r<avg;
  // 도넛 3개: 우리(LG·ThinQ)만 빨간색, 나머지는 회색
  $('ud-tiles').innerHTML=[
    donut('LG 가전 점유율',u.share,'LG','기타 브랜드','이 나라 가전 시장에서 LG가 차지하는 비중',false),
    donut('ThinQ 앱 점유율',u.app,'ThinQ','기타 스마트홈 앱','이 나라 스마트홈 앱 사용자 중 ThinQ 비중',false),
    donut('점유율 대비 사용률',Math.round(r),'ThinQ 사용','미사용',`LG 가전 가구 중 ThinQ를 쓰는 비율 · 17개 시장 평균 ${avg.toFixed(0)}%`,low),
  ].join('');
  $('ud-tip').innerHTML=tip(low
    ?`${esc(name)}은(는) LG 가전 점유율에 비해 ThinQ 사용률이 평균보다 낮습니다. <b>시장 분석</b>의 경쟁 앱 비교와 아래 현지 기능 공백에서 이유를 먼저 찾아보세요.`
    :`${esc(name)}은(는) 점유율 대비 사용률이 평균 이상입니다. 기존 사용자가 겪는 <b>현지화 니즈</b>를 먼저 보세요.`);

  // 요약: 핵심 숫자 3개 + 한 문단 요약 + 귀속 수준 안내
  $('dt-meta').innerHTML=[['시장 그룹',d.group],['분석 리뷰',n.toLocaleString('ko-KR')+'건'],['현지화 니즈',cands.length?cands.length+'건':'없음']]
    .map(([k,val])=>`<span><em>${k}</em><b>${esc(val)}</b></span>`).join('');
  $('dt-attr').title=at.note;

  // 국가별 이슈 집중도: 현지화 니즈는 판정 색으로 표시
  const rows=Object.entries(d.lifts).map(([t,l])=>({t,l,c:cands.find(x=>x.t===t)})).sort((a,b)=>b.l-a.l);
  const LM=Math.max(4,Math.ceil(Math.max(...rows.map(r=>r.l))));
  $('dt-topics').innerHTML=rows.map(r=>{
    const vv=r.c?vOf(r.c.v):null;
    return `<div class="row ${r.c?'top':''} ${r.c&&r.c===c?'sel':''}"><span class="nm">${vv?`<i class="vdot" style="background:${fill(vv)}" title="${vv.name}"></i>`:'<i class="vdot off"></i>'}${r.t}</span><div class="track"><div class="fill" style="width:${Math.min(100,r.l/LM*100)}%;${vv?`background:${col(vv)}`:''}"></div><div class="one" style="left:${100/LM}%"></div></div><b>${r.l.toFixed(2)}</b></div>`;
  }).join('')
    +tip(cands.length
      ?`색이 칠해진 이슈가 현지화 니즈입니다. ${cands[0].t} ${cands[0].lift.toFixed(2)}는 ${name}에서 이 이슈의 비중이 전체 국가 평균의 ${cands[0].lift.toFixed(2)}배라는 뜻입니다.`
      :`${name}은(는) 전체 국가 평균보다 뚜렷하게 많은 이슈가 없어 현지화 니즈가 없습니다.`);

  // 현지화 니즈 요약
  let sum: string;
  if(!c)sum=`${name}은(는) 분석 리뷰 ${n.toLocaleString('ko-KR')}건 중 판정 기준을 넘는 이슈가 없어 현지화 니즈를 만들지 않았습니다. 특정 이슈가 다른 시장보다 두드러지지 않는다는 뜻이며, 문제가 없다는 뜻은 아닙니다.`;
  else{
    const c0=cands[0],v0=vOf(c0.v);
    sum=`${name}의 1순위 현지화 니즈는 <b>${STAGE_OF[c0.t]}</b> 단계의 <b>${c0.t}</b>입니다. 전체 국가 평균 대비 <b>${c0.lift.toFixed(2)}배</b> 많이 언급되며, 판정은 <b>${v0.name}</b>(${c0.rule})입니다. `;
    if(cands.length>1)sum+=`이 밖에 ${cands.slice(1).map(x=>`${x.t}(${vOf(x.v).name})`).join(', ')}도 현지화 니즈입니다. `;
    if(d.attr==='lang')sum+=`${name}은 언어권 단위라 국가별 결론으로 쓰기 전에 사내 데이터로 국가를 먼저 확정해야 합니다.`;
    else if(small)sum+=`분석 리뷰가 ${n.toLocaleString('ko-KR')}건으로 적어 해석에 주의가 필요합니다.`;
  }
  $('dt-sum').innerHTML=sum;

  // 현지화 니즈와 검토할 점
  $('dt-cands').innerHTML=cands.length?cands.map((x,i)=>{
    const vv=vOf(x.v);
    return `<button type="button" class="cand" data-i="${i}" aria-pressed="${i===sel}">
      <div class="cand-h">${pill(vv)}<b>${x.t}</b><span class="stage-tag">${STAGE_OF[x.t]}</span></div>
      <div class="cand-m"><span>국가별 이슈 집중도 <b>${x.lift.toFixed(2)}</b></span><span>${x.rule}</span></div>
      <div class="cand-d">${vv.desc}</div>
      <ul class="alts">${alts(x,name).map(([s,t])=>`<li><span class="alt ${s}">${s==='rejected'?'기각':'미확인'}</span>${t}</li>`).join('')}</ul>
    </button>`;
  }).join(''):`<div class="empty-note">현지화 니즈가 없어 검토할 점도 따로 정리하지 않았습니다.</div>`;
  $('dt-cands').querySelectorAll<HTMLElement>('.cand').forEach(b=>b.onclick=()=>{sel=+b.dataset.i!;draw()});

  opportunity(name);
  agent(name,c);

  // 같은 현지화 니즈가 있는 시장
  const same=c?M.map((m,i)=>({m,i,x:D[m[0]].cands.find(y=>y.t===c.t)})).filter(o=>o.i!==cur&&o.x):[];
  $('dt-peers').innerHTML=same.length?same.map(o=>{const vv=vOf(o.x.v);return`<div class="peer"><i style="width:8px;height:8px;border-radius:2px;background:${fill(vv)}"></i><span class="nm"><button data-i="${o.i}">${o.m[0]}</button></span><b>${o.x.lift.toFixed(2)}</b></div>`}).join('')
    :`<div class="empty-note">${c?'같은 이슈가 현지화 니즈인 다른 시장이 없습니다.':'현지화 니즈가 없어 비교할 수 없습니다.'}</div>`;
  $('dt-peer-sub').innerHTML=same.length?`<span class="sub">${c.t} · 오른쪽은 국가별 이슈 집중도</span>`:'';
  $('dt-peers').querySelectorAll<HTMLElement>('button').forEach(b=>b.onclick=()=>{cur=+b.dataset.i!;const k=D[M[cur][0]].cands.findIndex(y=>y.t===c!.t);sel=Math.max(0,k);draw()});

  // 근거 리뷰: 샘플 원문이 있으면 그대로, 없으면 자리 표시
  const rv=c?(REV[name]||[]).filter(r=>r.t===c.t).slice(0,3):[];
  $('dt-reviews').innerHTML=rv.length
    ?rv.map(r=>`<div class="rv"><div class="meta"><span class="stars">${'★'.repeat(r.s)}<span style="color:var(--line-2)">${'★'.repeat(5-r.s)}</span></span><span>${r.at}</span><span>${r.lang}</span></div><p class="rv-x">${esc(r.x)}</p></div>`).join('')
    :[1,1,2].map((st,k)=>`<div class="rv"><div class="meta"><span class="stars">${'★'.repeat(st)}<span style="color:var(--line-2)">${'★'.repeat(5-st)}</span></span><span>${c?c.t:'현지화 니즈 없음'}</span></div><div class="ln" style="width:${92-k*9}%"></div><div class="ln" style="width:${70-k*12}%"></div></div>`).join('')
      +`<div class="empty-note">${c?'샘플 데이터에 이 현지화 니즈의 원문이 없어 자리만 표시했습니다.':''}</div>`;
}
document.querySelectorAll<HTMLElement>('#ag-goal button').forEach(b=>b.onclick=()=>{goal=b.dataset.g as Goal;draw()});

// ---------- 현지화 기회 ----------
const todo=(items: string[])=>`<ul class="todo">${items.map(t=>`<li>${t}</li>`).join('')}</ul>`;
const state=(done: boolean)=>`<span class="opp-badge ${done?'done':''}">${done?'조사 완료':'조사 전'}</span>`;
function opportunity(name: string){
  const o=OPP[name]||{competitors:[],devices:[]},f=FEAT[name];
  // 예시 2: 현지 기능 공백
  const high=f.lift>=1.3&&f.resid>=2;
  $('lf-badge').innerHTML=state(o.devices.length>0);
  $('lf-body').innerHTML=`
    <div class="opp-metric"><span>기능 요청·기타 리뷰 비중</span><b>${f.share.toFixed(1)}% <small>전체 국가 평균 ${FEAT_AVG.toFixed(1)}%</small>${high?'<i class="flag">평균보다 많음</i>':''}</b><em>국가별 이슈 집중도 ${f.lift.toFixed(2)} · ${f.count.toLocaleString('ko-KR')}건 · 현지화 니즈 판정에서는 제외한 분류</em></div>
    ${o.devices.length?`<ul class="devs">${o.devices.map(x=>`<li><div><b>${esc(x.device)}</b><span>${esc(x.note)}</span><span class="opp-src">출처 · ${esc(x.source)}</span></div><span class="sup ${x.inThinq==='미지원'?'no':x.inThinq==='지원'?'yes':''}">${x.inThinq}</span></li>`).join('')}</ul>`
    :`<div class="opp-empty"><b>${esc(name)}의 현지 특화 가전을 아직 조사하지 않았습니다</b>${todo(['이 나라에서 많이 쓰는 현지 특화 가전·기능','ThinQ 앱 지원 여부','관련 기능 요청 리뷰'])}</div>`}
    ${tip(`이 분류에는 기능 요청 말고 일반 칭찬도 섞여 있습니다. 현지 가전·기능 이름으로 다시 걸러야 근거로 쓸 수 있습니다.${high?` ${esc(name)}은(는) 이 비중이 평균보다 뚜렷이 높아 먼저 볼 만합니다.`:''}`)}`;
}

// ---------- 에이전트 제안 ----------
let agentText='';
function agent(name: string, c: Cand | null){
  document.querySelectorAll<HTMLElement>('#ag-goal button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.g===goal)));
  const box=$('ag-body'),g=GOALS[goal];
  const sg=c?suggest(name,c.t,goal):null;
  if(!c||!sg){
    box.innerHTML=tip(`${esc(name)}은(는) 현지화 니즈가 없어 제안을 만들지 않았습니다. 다른 시장과 비교해 두드러진 이슈가 생기면 제안이 나타납니다.`);
    agentText='';return;
  }
  const v=vOf(c.v);
  box.innerHTML=`
    <p class="ag-lead">${esc(g.label)} 목표는 <b>${esc(g.stage)}</b> 단계의 문제입니다. 선택한 현지화 니즈 <b>${esc(c.t)}</b>(국가별 이슈 집중도 ${c.lift.toFixed(2)} · ${v.name})가 이 목표를 막는지, 사내 데이터로 먼저 확인할 지표를 제안합니다.${sg.lang?` <span class="small-badge">언어권 참고 · 국가 확정 필요</span>`:''}</p>
    <div class="ag-grid">
      <div class="ag-col">
        <div class="ag-h">확인할 내부 지표</div>
        <ol class="ag-met">${sg.metrics.map((m,i)=>`<li class="${i===0?'top':''}">
          <div class="ag-row"><b>${esc(m.name)}</b>${i===0?'<span class="ag-first">먼저 확인</span>':''}</div>
          <span class="ag-why">${esc(m.why)}</span>
          <span class="ag-meta"><em>판단 기준</em> ${esc(m.rule)}</span>
          <span class="ag-meta"><em>사내 데이터</em> ${esc(m.src)}</span>
        </li>`).join('')}</ol>
      </div>
      <div class="ag-col">
        <div class="ag-h">개선 방향 후보</div>
        ${sg.solutions.map(s=>`<div class="ag-sol"><b>${esc(s.name)}</b><span>${esc(s.what)}</span><span class="ag-meta"><em>효과 확인</em> ${esc(s.measure)}</span></div>`).join('')}
      </div>
    </div>
    <div class="mk-tip ag-foot">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> '먼저 확인' 지표로 현지화 니즈가 맞는지 확인한 뒤 개선 방향을 고르세요.</span><button type="button" class="ag-copy" id="ag-copy">제안 복사</button></div>`;
  agentText=[`[에이전트 제안] ${name} · ${g.label}`,`현지화 니즈: ${c.t} (${STAGE_OF[c.t]} · 국가별 이슈 집중도 ${c.lift.toFixed(2)} · ${v.name})`,'','확인할 내부 지표',...sg.metrics.map((m,i)=>`- ${m.name}${i===0?' [먼저 확인]':''}: ${m.why} / 판단 기준: ${m.rule} / 데이터: ${m.src}`),'','개선 방향 후보',...sg.solutions.map(s=>`- ${s.name}: ${s.what} (효과 확인: ${s.measure})`),'','공개 리뷰 기반 가설 · AI 생성 초안 · 미검토'].join('\n');
  $('ag-copy').onclick=()=>copyText(agentText,'에이전트 제안을 복사했습니다');
}


// 도넛 차트 한 개 (빨강 = LG·ThinQ, 회색 = 나머지)
function donut(title: string, pct: number, main: string, rest: string, sub: string, low: boolean){
  const R=38,C=2*Math.PI*R,a=pct/100*C,g=1.5;
  return `<figure class="dn ${low?'low':''}">
    <figcaption>${title}${low?'<i class="flag">평균보다 낮음</i>':''}</figcaption>
    <div class="dn-body">
      <svg viewBox="0 0 100 100" role="img" aria-label="${title} ${pct}%">
        <circle cx="50" cy="50" r="${R}" class="d-rest" stroke-dasharray="${Math.max(0,C-a-g*2)} ${C}" stroke-dashoffset="${-(a+g)}" transform="rotate(-90 50 50)"><title>${rest} ${100-pct}%</title></circle>
        <circle cx="50" cy="50" r="${R}" class="d-main" stroke-dasharray="${a} ${C}" transform="rotate(-90 50 50)"><title>${main} ${pct}%</title></circle>
        <text x="50" y="55" text-anchor="middle" class="d-val">${pct}%</text>
      </svg>
      <ul class="dn-key"><li><i class="k main"></i>${main} <b>${pct}%</b></li><li><i class="k"></i>${rest} <b>${100-pct}%</b></li></ul>
    </div>
    <p>${sub}</p>
  </figure>`;
}

// 라우터가 #voc 를 보여 줄 때 호출: #voc.3 이면 4번째 시장, 숫자가 없으면 보던 시장 그대로
export function onShow(param){
  if(param!==''&&!isNaN(+param)){const i=Math.max(0,Math.min(M.length-1,+param));if(i!==cur)sel=0;cur=i}
  draw();
}
// 다크 모드 전환 등으로 색이 바뀌면 다시 그립니다
export function redrawDetail(){if(!$('view-mk').hidden)draw()}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redrawDetail)}catch(e){}
new MutationObserver(redrawDetail).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
