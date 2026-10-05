// 국가별 시장 분석(#market) · v3: 사용 단계 → 장벽 후보 → 근거 → 다른 가능성 → 확인할 지표·개선 방향
import { M, V, fill, col } from '../data/markets';
import { D, STAGES, STAGE_OF, ATTR, REV, type Cand } from '../data/locus';
import { GOALS, suggest, type Goal } from '../data/agent';
import { esc, copyText } from '../shared/ui';
import { go, setParam, currentRoute } from '../router';

const BULB='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/></svg>';
const tip=(t: string)=>`<div class="mk-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> ${t}</span></div>`;
let cur=0,sel=0,goal: Goal='retain';
const $=(id: string)=>document.getElementById(id)!;
const vOf=(id: string)=>V.find(x=>x.id===id)!;
const pill=v=>`<span class="pill" style="${v.id==='none'?'background:transparent;border-color:var(--line-2);color:var(--ink-3)':`background:color-mix(in oklab, ${col(v)} 16%, var(--surface));color:var(--ink)`}"><i style="background:${fill(v)}"></i>${v.name}</span>`;

// 장벽 후보마다 함께 봐야 할 다른 가능성 (기각 = 데이터로 이미 배제, 미확인 = 추가 확인 필요)
function alts(c: Cand, name: string){
  const d=D[name],small=M[cur][1];
  const a: [string,string][]=[['rejected','7월 서비스 장애 때문이다 → 장애 구간을 빼고 계산한 값이라 해당하지 않음']];
  const byV={
    wide:'여러 시장에 공통으로 나타남 → 이 시장의 현지 요인보다 앱·서버 공통 원인일 가능성이 큼',
    group:`같은 그룹(${d.group}) 시장에도 나타남 → 그룹의 제품 구성(많이 쓰는 가전) 차이일 수 있음`,
    part:'일부 이웃 시장에도 나타남 → 몇 개 시장 묶음의 공통 원인일 수 있음',
    special:'이웃 시장에는 드묾 → 다만 쏠림만으로 현지화 원인을 확정할 수 없어 원문 검수가 필요함',
    solo:'비교할 이웃 시장이 없음 → 공통 문제인지 이 시장만의 문제인지 규칙으로 판단할 수 없음',
  };
  a.push(['open',byV[c.v]]);
  if(d.attr==='lang')a.push(['open',`${name} 리뷰는 여러 나라가 섞여 있음 → 특정 국가 문제로 볼 근거가 없음`]);
  if(small)a.push(['open','분석 리뷰가 적음 → 국가별 이슈 집중도가 크게 흔들릴 수 있음']);
  return a;
}

function list(){
  const box=$('mlist');box.innerHTML='';
  M.forEach((m,i)=>{
    const v=vOf(m[5]);
    const b=document.createElement('button');b.className='mi';b.id='mi-'+i;b.setAttribute('aria-current',String(i===cur));
    b.innerHTML=`<i style="background:${fill(v)};${v.id==='none'?'box-shadow:inset 0 0 0 1px var(--line-2)':''}"></i><span class="nm">${m[0]}</span><span class="lv">${m[4]?m[4].toFixed(2):'—'}</span>`;
    b.onclick=()=>{cur=i;sel=0;draw()};box.appendChild(b);
  });
}

function draw(){
  if(currentRoute()==='market')setParam(String(cur));
  list();
  const [name,small,n,,,vid,rate]=M[cur],v=vOf(vid),d=D[name],cands=d.cands,at=ATTR[d.attr];
  const c=cands[sel]||null;
  $('dt-name').textContent=name;$('dt-pill').innerHTML=pill(v);
  $('dt-attr').innerHTML=`<span class="attr ${d.attr}">${at.name}</span>`;
  $('dt-small').innerHTML=small?'<span class="small-badge">리뷰 적음</span>':'';

  // 기본 정보
  $('dt-kv').innerHTML=[
    ['귀속 수준',at.name,''],['시장 그룹',d.group,''],['분석 리뷰 수',n.toLocaleString('ko-KR')+'건','n'],
    ['장벽 후보',cands.length?`${cands.length}건`:'없음','n'],['1순위 장벽 후보',cands[0]?.t||'—',''],['불만 리뷰 비율(참고)',rate.toFixed(1)+'%','n']
  ].map(([k,val,cl])=>`<div><span>${k}</span><b class="${cl}">${esc(val)}</b></div>`).join('');
  $('dt-attr-note').textContent=`${at.name} · ${at.note}. 불만 리뷰 비율은 시장마다 별점 문화가 달라 시장 간 비교에 쓰지 않습니다.`;

  // 국가별 이슈 집중도: 장벽 후보는 판정 색으로 표시
  const rows=Object.entries(d.lifts).map(([t,l])=>({t,l,c:cands.find(x=>x.t===t)})).sort((a,b)=>b.l-a.l);
  const LM=Math.max(4,Math.ceil(Math.max(...rows.map(r=>r.l))));
  $('dt-topics').innerHTML=rows.map(r=>{
    const vv=r.c?vOf(r.c.v):null;
    return `<div class="row ${r.c?'top':''} ${r.c&&r.c===c?'sel':''}"><span class="nm">${vv?`<i class="vdot" style="background:${fill(vv)}" title="${vv.name}"></i>`:'<i class="vdot off"></i>'}${r.t}</span><div class="track"><div class="fill" style="width:${Math.min(100,r.l/LM*100)}%;${vv?`background:${col(vv)}`:''}"></div><div class="one" style="left:${100/LM}%"></div></div><b>${r.l.toFixed(2)}</b></div>`;
  }).join('')
    +tip(cands.length
      ?`색이 칠해진 이슈가 장벽 후보입니다. 국가별 이슈 집중도 1.3 이상이면서 우연으로 보기 어려운(잔차 2 이상) 이슈만 후보로 봅니다. 예를 들어 ${cands[0].t} ${cands[0].lift.toFixed(2)}는 ${name}에서 이 이슈의 비중이 전체 국가 평균의 ${cands[0].lift.toFixed(2)}배라는 뜻입니다.`
      :`${name}은(는) 판정 기준(국가별 이슈 집중도 1.3 이상 · 잔차 2 이상)을 넘는 이슈가 없습니다.`);

  // 사용 단계
  $('dt-stages').innerHTML=STAGES.map(s=>{
    const k=cands.filter(x=>STAGE_OF[x.t]===s);
    const blind=s==='인지·설치'||s==='경쟁 앱 비교';
    return `<li class="${k.length?'on':''} ${blind?'blind':''}"><b>${s}</b><span>${blind?'리뷰로 확인 어려움':k.length?k.map(x=>x.t).join(', '):'후보 없음'}</span></li>`;
  }).join('');

  // 장벽 후보 요약
  let sum: string;
  if(!c)sum=`${name}은(는) 분석 리뷰 ${n.toLocaleString('ko-KR')}건 중 판정 기준을 넘는 이슈가 없어 장벽 후보를 만들지 않았습니다. 특정 이슈가 다른 시장보다 두드러지지 않는다는 뜻이며, 문제가 없다는 뜻은 아닙니다.`;
  else{
    const c0=cands[0],v0=vOf(c0.v);
    sum=`${name}의 1순위 장벽 후보는 <b>${STAGE_OF[c0.t]}</b> 단계의 <b>${c0.t}</b>입니다. 전체 국가 평균 대비 <b>${c0.lift.toFixed(2)}배</b> 많이 언급되며, 판정은 <b>${v0.name}</b>(${c0.rule})입니다. `;
    if(cands.length>1)sum+=`이 밖에 ${cands.slice(1).map(x=>`${x.t}(${vOf(x.v).name})`).join(', ')}도 후보입니다. `;
    if(d.attr==='lang')sum+=`${name}은 언어권 단위라 국가별 결론으로 쓰기 전에 사내 데이터로 국가를 먼저 확정해야 합니다.`;
    else if(small)sum+=`분석 리뷰가 ${n.toLocaleString('ko-KR')}건으로 적어 해석에 주의가 필요합니다.`;
  }
  $('dt-sum').innerHTML=sum;

  // 장벽 후보와 다른 가능성
  $('dt-cands').innerHTML=cands.length?cands.map((x,i)=>{
    const vv=vOf(x.v);
    return `<button type="button" class="cand" data-i="${i}" aria-pressed="${i===sel}">
      <div class="cand-h">${pill(vv)}<b>${x.t}</b><span class="stage-tag">${STAGE_OF[x.t]}</span></div>
      <div class="cand-m"><span>국가별 이슈 집중도 <b>${x.lift.toFixed(2)}</b></span><span>잔차 <b>${x.resid.toFixed(2)}</b></span><span>${x.rule}</span></div>
      <div class="cand-d">${vv.desc}</div>
      <ul class="alts">${alts(x,name).map(([s,t])=>`<li><span class="alt ${s}">${s==='rejected'?'기각':'미확인'}</span>${t}</li>`).join('')}</ul>
    </button>`;
  }).join(''):`<div class="empty-note">장벽 후보가 없어 다른 가능성도 따로 정리하지 않았습니다.</div>`;
  $('dt-cands').querySelectorAll<HTMLElement>('.cand').forEach(b=>b.onclick=()=>{sel=+b.dataset.i!;draw()});

  agent(name,c);

  // 같은 장벽 후보가 있는 시장
  const same=c?M.map((m,i)=>({m,i,x:D[m[0]].cands.find(y=>y.t===c.t)})).filter(o=>o.i!==cur&&o.x):[];
  $('dt-peers').innerHTML=same.length?same.map(o=>{const vv=vOf(o.x.v);return`<div class="peer"><i style="width:8px;height:8px;border-radius:2px;background:${fill(vv)}"></i><span class="nm"><button data-i="${o.i}">${o.m[0]}</button></span><b>${o.x.lift.toFixed(2)}</b></div>`}).join('')
    :`<div class="empty-note">${c?'같은 이슈가 장벽 후보인 다른 시장이 없습니다.':'장벽 후보가 없어 비교할 수 없습니다.'}</div>`;
  $('dt-peer-sub').innerHTML=same.length?tip(`<b>${c.t}</b>이(가) 장벽 후보인 시장입니다. 오른쪽 숫자는 각 시장의 국가별 이슈 집중도입니다.`):'';
  $('dt-peers').querySelectorAll<HTMLElement>('button').forEach(b=>b.onclick=()=>{cur=+b.dataset.i!;const k=D[M[cur][0]].cands.findIndex(y=>y.t===c!.t);sel=Math.max(0,k);draw()});

  // 근거 리뷰: 샘플 원문이 있으면 그대로, 없으면 자리 표시
  const rv=c?(REV[name]||[]).filter(r=>r.t===c.t).slice(0,3):[];
  $('dt-reviews').innerHTML=rv.length
    ?rv.map(r=>`<div class="rv"><div class="meta"><span class="stars">${'★'.repeat(r.s)}<span style="color:var(--line-2)">${'★'.repeat(5-r.s)}</span></span><span>${r.at}</span><span>${r.lang}</span></div><p class="rv-x">${esc(r.x)}</p></div>`).join('')
    :[1,1,2].map((st,k)=>`<div class="rv"><div class="meta"><span class="stars">${'★'.repeat(st)}<span style="color:var(--line-2)">${'★'.repeat(5-st)}</span></span><span>${c?c.t:'장벽 후보 없음'}</span></div><div class="ln" style="width:${92-k*9}%"></div><div class="ln" style="width:${70-k*12}%"></div></div>`).join('')
      +`<div class="empty-note">${c?'샘플 데이터에 이 후보의 원문이 없어 자리만 표시했습니다.':''}</div>`;
}
document.querySelectorAll<HTMLElement>('#ag-goal button').forEach(b=>b.onclick=()=>{goal=b.dataset.g as Goal;draw()});

// ---------- 에이전트 제안 ----------
let agentText='';
function agent(name: string, c: Cand | null){
  document.querySelectorAll<HTMLElement>('#ag-goal button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.g===goal)));
  const box=$('ag-body'),g=GOALS[goal];
  const sg=c?suggest(name,c.t,goal):null;
  if(!c||!sg){
    box.innerHTML=tip(`${esc(name)}은(는) 장벽 후보가 없어 제안을 만들지 않았습니다. 다른 시장과 비교해 두드러진 이슈가 생기면 제안이 나타납니다.`);
    agentText='';return;
  }
  const v=vOf(c.v);
  box.innerHTML=`
    <p class="ag-lead">${esc(g.label)} 목표는 <b>${esc(g.stage)}</b> 단계의 문제입니다. 선택한 장벽 후보 <b>${esc(c.t)}</b>(국가별 이슈 집중도 ${c.lift.toFixed(2)} · ${v.name})가 이 목표를 막는지, 사내 데이터로 먼저 확인할 지표를 제안합니다.${sg.lang?` <span class="small-badge">언어권 참고 · 국가 확정 필요</span>`:''}</p>
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
    <div class="mk-tip ag-foot">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> '먼저 확인' 지표로 장벽이 맞는지 확인한 뒤 개선 방향을 고르세요.</span><button type="button" class="ag-copy" id="ag-copy">제안 복사</button></div>`;
  agentText=[`[에이전트 제안] ${name} · ${g.label}`,`장벽 후보: ${c.t} (${STAGE_OF[c.t]} · 국가별 이슈 집중도 ${c.lift.toFixed(2)} · ${v.name})`,'','확인할 내부 지표',...sg.metrics.map((m,i)=>`- ${m.name}${i===0?' [먼저 확인]':''}: ${m.why} / 판단 기준: ${m.rule} / 데이터: ${m.src}`),'','개선 방향 후보',...sg.solutions.map(s=>`- ${s.name}: ${s.what} (효과 확인: ${s.measure})`),'','공개 리뷰 기반 가설 · AI 생성 초안 · 미검토'].join('\n');
  $('ag-copy').onclick=()=>copyText(agentText,'에이전트 제안을 복사했습니다');
}

$('mk-body').addEventListener('click',e=>{const tr=(e.target as HTMLElement).closest<HTMLElement>('tr');if(!tr)return;go('market',tr.dataset.i)});

// 라우터가 #market 을 보여 줄 때 호출: #market.3 이면 4번째 시장을 엽니다
export function onShow(param){
  if(param!==''&&!isNaN(+param)){const i=Math.max(0,Math.min(M.length-1,+param));if(i!==cur)sel=0;cur=i}
  draw();
}
// 다크 모드 전환 등으로 색이 바뀌면 시장 현황 표가 부릅니다
export function redrawDetail(){if(!$('view-mk').hidden)draw()}
