// VoC 분석(#voc) · 시장 하나를 골라 두 탭으로 봅니다
//   AI 인사이트: 시장 진단(요약·KPI·이슈 프로필·판단 결과·같은 이슈가 있는 시장) → 확인할 과제
//   데이터 분석: ThinQ 사용 현황(도넛) → 리뷰 추이(trend.ts) → 이슈 상세 분석(국가별 이슈 집중도·근거 리뷰)
import { M, V } from '../data/markets';
import { D, REV, type Cand } from '../data/locus';
import { USAGE, ratio, RATIO_AVG } from '../data/usage';
import { esc, toast, AGENT_ICON } from '../shared/ui';
import { go, setParam, currentRoute } from '../router';
import { setMarket } from './trend';
import { addFromVoc } from './issues';

const $=(id: string)=>document.getElementById(id)!;
const vOf=(id: string)=>V.find(x=>x.id===id)||V[3];
const f2=(n: number)=>n.toFixed(2);
const nf=(n: number)=>n.toLocaleString('ko-KR');
const THR=1.3, LOW=0.5;            // 현지화 니즈 기준 (국가별 이슈 집중도) · 평균보다 적게 언급된 이슈 기준
const RESID_THR=2;                  // 현지화 니즈 기준 (표준화 잔차)
let cur=0, sel=0, tab: 'ai'|'data'='ai', showAvg=false;
const decided: Record<string,'ok'|'hold'>={};   // 확인할 과제 처리 상태 (시장|이슈)

const asum=(lines: string[])=>`<div class="asum-h">${AGENT_ICON}<b>에이전트 요약</b></div><ul>${lines.map(l=>`<li>${l}</li>`).join('')}</ul>`;
const badge=(v: string)=>`<span class="vd v-${v}">${vOf(v).name}</span>`;
const red=(t: string|number)=>`<b class="em">${t}</b>`;

// 판정 세부 규칙(k)별 설명
const KIND: Record<string,{line:string; owner:string}>={
  wide:{line:'여러 국가에서 동시에 발생하는 오류로 파악됨',owner:'본사 개발팀'},
  group:{line:'같은 그룹의 여러 시장에서 함께 나타남',owner:'제품군·시장 묶음 담당'},
  part:{line:'같은 그룹의 일부 시장에서 함께 나타남',owner:'제품군·시장 묶음 담당'},
  special:{line:'이웃 시장에는 드물고 이 시장에서만 두드러짐 · 원인 검수 후 확정',owner:'검토 후 결정'},
  solo:{line:'비교할 이웃 시장이 없어 이 시장만으로 판단함 · 원인 검수 후 확정',owner:'검토 후 결정'},
};
const kindOf=(c: Cand)=>KIND[c.k]||KIND.special;

// 같은 이슈가 현지화 니즈로 잡힌 시장 (지금 시장 포함, 집중도 큰 순)
const peersOf=(t: string)=>M.map((m,i)=>({name:m[0],i,c:D[m[0]].cands.find(y=>y.t===t)})).filter(o=>o.c).sort((a,b)=>b.c!.lift-a.c!.lift);
// 이 이슈가 평균보다 크게 적은 시장 (예외로 표시)
const lowestOf=(t: string)=>M.map(m=>({name:m[0],l:D[m[0]].lifts[t]})).filter(o=>o.l!=null&&o.l<LOW).sort((a,b)=>a.l-b.l)[0];

function list(){
  const box=$('mk-select') as HTMLSelectElement;
  if(!box.options.length){
    box.innerHTML=M.map((m,i)=>`<option value="${i}">${m[0]}</option>`).join('');
    box.onchange=()=>go('voc',box.value);
  }
  box.value=String(cur);
}

function setTab(t: 'ai'|'data'){
  tab=t;
  $('vt-ai').setAttribute('aria-selected',t==='ai');$('vt-data').setAttribute('aria-selected',t==='data');
  $('vp-ai').hidden=t!=='ai';$('vp-data').hidden=t!=='data';$('vk-period').hidden=t!=='ai';
}

function draw(){
  if(currentRoute()==='voc')setParam(String(cur));
  list();setTab(tab);
  const name=M[cur][0];
  setMarket(name);
  const d=D[name],cands=d.cands;
  if(sel>=cands.length)sel=0;
  drawAI(name,d,cands);
  drawData(name,d,cands);
}

// ---------- AI 인사이트 ----------
function drawAI(name: string, d: typeof D[string], cands: Cand[]){
  const n=M[cur][2],c0=cands[0];
  const lines: string[]=[];
  if(!c0)lines.push(`${esc(name)}은(는) 판정 기준을 넘는 이슈가 없어 <b>판정 보류</b>입니다. 특정 이슈가 다른 시장보다 두드러지지 않는다는 뜻이며, 문제가 없다는 뜻은 아닙니다.`);
  else{
    lines.push(`${esc(name)}의 1순위 이슈는 <b>${esc(c0.t)}</b>입니다.`);
    cands.slice(0,3).forEach(c=>lines.push(`<b>${esc(c.t)}</b>(${f2(c.lift)}배)는 ${c.v==='wide'?'여러 그룹 시장에 공통으로 나타나':c.v==='multi'?'같은 그룹 시장에도 나타나':c.k==='solo'?'비교할 이웃 시장 없이 '+esc(name)+'에서 두드러져, 원인 검수 후':esc(name)+'에서만 두드러져, 원인 검수 후'} <b>${vOf(c.v).name}</b>${c.v==='local'?'로 확정이 필요합니다.':'로 판단했습니다.'}`));
  }
  if(d.attr==='lang')lines.push(`${esc(name)}은 여러 나라가 섞인 언어권이라, 국가별 결론으로 쓰기 전에 사내 데이터로 국가를 먼저 확정해야 합니다.`);
  $('ai-sum').innerHTML=asum(lines);

  $('ai-kpis').innerHTML=[
    ['분석 리뷰',`${nf(n)}건`,M[cur][1]?'리뷰 적음':''],
    ['발견된 현지화 니즈',`${cands.length}개`,cands.length?'':'판정 보류'],
    ['1순위 이슈 집중도',c0?f2(c0.lift):'—',c0?esc(c0.t):''],
  ].map(([k,v,s])=>`<div class="vkpi"><span class="k">${k}</span><div class="b"><b>${v}</b>${s?`<span>${s}</span>`:''}</div></div>`).join('');

  radar(name,d,cands);
  const c=cands[sel]||null;

  // 판단 결과
  $('ai-verdicts').innerHTML=cands.length?cands.map((x,i)=>`<button type="button" class="vdc" data-i="${i}" aria-pressed="${i===sel}">
      ${badge(x.v)}<b>${esc(x.t)}</b>
      <span class="l1">${esc(name)}에서 ${f2(x.lift)}로, 이슈 집중도가 높게 나타납니다.</span>
      <span class="l2">${kindOf(x).line}</span>
      <span class="l3">담당 범위 <b>${kindOf(x).owner}</b></span>
    </button>`).join('')
    :`<div class="empty-note">판정 기준(이슈 집중도 ${THR} 이상, 표준화 잔차 ${RESID_THR} 이상)을 넘는 이슈가 없습니다.</div>`;
  $('ai-verdicts').querySelectorAll<HTMLElement>('.vdc').forEach(b=>b.onclick=()=>{sel=+b.dataset.i!;draw()});

  // 같은 현지화 이슈가 있는 시장 (막대 그라데이션: 집중도 큰 순으로 진한 빨강 → 연한 빨강)
  if(!c){$('pe-sub').textContent='이슈 집중도 순';$('ai-peers').innerHTML='<div class="empty-note">현지화 니즈가 없어 비교할 시장이 없습니다.</div>'}
  else{
    const ps=peersOf(c.t),mx=ps[0].c!.lift,low=lowestOf(c.t);
    $('pe-sub').textContent=`${c.t} · 이슈 집중도 순`;
    $('ai-peers').innerHTML=`<div class="pe-hd"><span>시장</span><span>집중도</span></div>`
      +ps.map((o,k)=>{const p=Math.round(100-k*(85/Math.max(1,ps.length-1)));const me=o.i===cur;
        return `<button type="button" class="pe${me?' me':''}" data-i="${o.i}" ${me?'aria-current="true"':''}>
          <span class="bar" style="width:${Math.max(28,o.c!.lift/mx*100)}%;background:color-mix(in srgb,var(--crit) ${p}%,var(--surface));color:${p>=55?'#fff':'var(--ink-2)'}">${esc(o.name)}</span>
          <b>${f2(o.c!.lift)}</b></button>`}).join('')
      +(ps.length===1?'<div class="empty-note">같은 이슈가 현지화 니즈인 다른 시장이 없습니다.</div>':'')
      +(low?`<p class="pe-note">*반대로 ${esc(low.name)}은(는) ${f2(low.l)}로 평균보다 크게 낮음</p>`:'');
    $('ai-peers').querySelectorAll<HTMLElement>('.pe:not(.me)').forEach(b=>b.onclick=()=>{const i=+b.dataset.i!;const k=D[M[i][0]].cands.findIndex(y=>y.t===c.t);cur=i;sel=Math.max(0,k);showAvg=false;go('voc',String(i))});
  }

  // 확인할 과제
  $('task-sum').innerHTML=asum(cands.length
    ?[`${red(cands.length+'건')}을 확인할 과제로 골랐습니다.`,'첨부된 근거와 설명을 통해 이슈의 내용을 확정해주세요.']
    :['판정 기준을 넘는 이슈가 없어 확인할 과제가 없습니다.']);
  $('tasks').innerHTML=cands.map((x,i)=>task(name,d,x,i)).join('');
  $('tasks').querySelectorAll<HTMLElement>('.task').forEach(t=>{
    const i=+t.dataset.i!,x=cands[i],key=name+'|'+x.t;
    t.onclick=e=>{if((e.target as HTMLElement).closest('button'))return;if(sel!==i){sel=i;draw()}};
    t.querySelector<HTMLElement>('[data-a="ok"]')!.onclick=()=>{
      if(decided[key]==='ok')return;
      decided[key]='ok';sel=i;
      const id=addFromVoc({title:`${x.t} (${name})`,verdict:x.v as any,langs:[name],topic:x.t,
        why:`VoC 분석에서 승인한 이슈입니다. ${name}에서 이슈 집중도 ${f2(x.lift)} · ${vOf(x.v).name}.`});
      toast(`${id} · 이슈보드 신규 열에 올렸습니다`);draw();
    };
    t.querySelector<HTMLElement>('[data-a="hold"]')!.onclick=()=>{if(decided[key]==='ok')return;decided[key]=decided[key]==='hold'?undefined:'hold';sel=i;draw()};
    t.querySelector<HTMLElement>('[data-a="rv"]')!.onclick=()=>{sel=i;setTab('data');draw();$('rv-title').scrollIntoView({block:'center'})};
  });
}

function task(name: string, d: typeof D[string], x: Cand, i: number){
  const key=name+'|'+x.t,st=decided[key],ps=peersOf(x.t),low=lowestOf(x.t);
  // 우선순위 판단: 표준화 잔차(리뷰 수를 감안한 쏠림 크기)를 기준 2와 비교. 기준의 2배 이상이면 '기준 위', 그 아래는 '기준 근처'
  const pos=(r: number)=>Math.min(100,Math.log2(1+r)/Math.log2(1+32)*100);
  const above=x.resid>=RESID_THR*2;
  const ev=[`이슈 집중도 ${f2(x.lift)} · 표준화 잔차 ${x.resid.toFixed(1)} - 리뷰 수를 감안해도 우연이 아닌 차이`];
  if(x.v==='wide')ev.push(`같은 이슈가 ${ps.length}개 시장에 나타남${low?` (${esc(low.name)}은 예외 ${f2(low.l)})`:''}`);
  else if(x.v==='multi')ev.push(`같은 그룹(${esc(d.group)}) 시장에도 나타남 · ${esc(x.rule)}`);
  else ev.push(x.k==='solo'?`비교할 이웃 시장이 없어 ${esc(name)} 단독으로 판단함`:`${esc(name)}에서만 나타나는 이슈로 ${vOf(x.v).name}로 판단됨`);
  ev.push(`2023.09 – 2026.09 리뷰 ${nf(M[cur][2])}건 기준`);
  const chk: [boolean,string][]=[[true,'7월 장애로 인한 문제가 아님 : 장애 구간(07-01 – 08-01)을 빼고 계산함']];
  if(x.v==='local')chk.push([false,'대표 리뷰 검토를 통해 원인 판단 필요']);
  chk.push([false,'제품 구성, OS, 앱 버전 차이로 설명되는지 담당자의 판단 필요']);
  if(d.attr==='lang')chk.push([false,'여러 나라가 섞인 언어권이라 어느 나라 문제인지 확인 필요']);
  if(M[cur][1])chk.push([false,'분석 리뷰가 적어 이슈 집중도가 크게 흔들릴 수 있음']);
  return `<article class="task${i===sel?' on':''}" data-i="${i}">
    <span class="no">이슈 ${i+1}</span>
    <h3>${esc(x.t)}</h3>
    ${badge(x.v)}
    <div class="urg"><span class="k">우선순위 판단</span>
      <div class="trk"><i class="fill${above?' hi':''}" style="width:${pos(x.resid)}%"></i><i class="thr" style="left:${pos(RESID_THR*2)}%"></i></div>
      <b class="${above?'hi':''}">${above?'기준 위':'기준 근처'}</b></div>
    <h4>근거</h4><ul class="ev">${ev.map(t=>`<li>${t}</li>`).join('')}</ul>
    <h4>확인이 필요한 내용</h4><ul class="ck">${chk.map(([ok,t])=>`<li class="${ok?'ok':'q'}"><i>${ok?'✓':'?'}</i><span><b>${t.split(' : ')[0]}</b>${t.includes(' : ')?' : '+t.split(' : ')[1]:''}</span></li>`).join('')}</ul>
    <p class="own">담당 범위 <b>${kindOf(x).owner}</b></p>
    <div class="acts">
      ${st==='ok'?'<span class="done">이슈보드에 올림</span>':''}
      <button type="button" class="btn dark" data-a="ok" ${st==='ok'?'disabled':''}>${st==='ok'?'승인됨':'이슈 승인'}</button>
      <button type="button" class="btn" data-a="hold" aria-pressed="${st==='hold'}" ${st==='ok'?'disabled':''}>${st==='hold'?'보류됨':'보류'}</button>
      <button type="button" class="btn" data-a="rv">근거 리뷰 보기</button>
    </div>
  </article>`;
}

// 이슈 프로필: 이 시장 집중도 상위 6개 이슈 · 빨강 = 고른 시장, 회색 = 한국(고른 시장이 한국이면 전체 평균 1.0)
function radar(name: string, d: typeof D[string], cands: Cand[]){
  const base=name==='한국'?null:D['한국'],baseName=base?'한국':'전체 평균';
  $('rd-key').innerHTML=`<span><i class="me"></i>${esc(name)}</span><span><i></i>${baseName}</span>`;
  const ax=Object.entries(d.lifts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([t,l])=>({t,l,b:base?base.lifts[t]:1,c:cands.some(c=>c.t===t)}));
  const W=322,H=262,cx=W/2,cy=H/2+4,R=78,n=ax.length;
  const mx=Math.max(2,...ax.map(a=>Math.max(a.l,a.b)))*1.05;
  const pt=(i: number,v: number)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*Math.min(v,mx)/mx;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  const poly=(vals: number[])=>vals.map((v,i)=>pt(i,v).map(z=>z.toFixed(1)).join(',')).join(' ');
  let g='';
  [1/3,2/3,1].forEach(f=>g+=`<polygon points="${poly(ax.map(()=>mx*f))}" fill="none" stroke="var(--line)"/>`);
  ax.forEach((_,i)=>{const [x,y]=pt(i,mx);g+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/>`});
  g+=`<polygon points="${poly(ax.map(a=>a.b))}" fill="var(--ink-3)" fill-opacity=".18" stroke="var(--ink-2)" stroke-dasharray="3 3"/>`;
  g+=`<polygon points="${poly(ax.map(a=>a.l))}" fill="var(--crit)" fill-opacity=".16" stroke="var(--crit)" stroke-width="1.5"/>`;
  ax.forEach((a,i)=>{const [x,y]=pt(i,a.l);g+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--crit)" stroke="var(--surface)" stroke-width="1.5"><title>${esc(a.t)} ${f2(a.l)} · ${baseName} ${f2(a.b)}</title></circle>`});
  ax.forEach((a,i)=>{
    const ang=-Math.PI/2+i*2*Math.PI/n,lx=cx+(R+16)*Math.cos(ang),ly=cy+(R+16)*Math.sin(ang);
    const anc=Math.abs(Math.cos(ang))<.2?'middle':Math.cos(ang)>0?'start':'end';
    const y0=Math.sin(ang)<-.5?ly-16:Math.sin(ang)>.5?ly+4:ly-6;
    g+=`<text x="${lx.toFixed(1)}" y="${y0.toFixed(1)}" text-anchor="${anc}" class="rl">${esc(a.t)}</text><text x="${lx.toFixed(1)}" y="${(y0+15).toFixed(1)}" text-anchor="${anc}" class="rv${a.c?' hi':''}">${f2(a.l)}</text>`;
  });
  $('ai-radar').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)} 이슈 프로필 (상위 ${n}개 이슈, ${baseName}와 비교)">${g}</svg>`;
}

// ---------- 데이터 분석 ----------
function drawData(name: string, d: typeof D[string], cands: Cand[]){
  // ThinQ 사용 현황 (## 목업데이터: src/data/usage.ts)
  const u=USAGE[name],r=Math.round(ratio(u)*100),avg=Math.round(RATIO_AVG*100),dv=r-avg;
  const ul=[`${esc(name)}은(는) ThinQ 앱 점유율(${red(u.app+'%')})이 LG 가전 점유율(${red(u.share+'%')})보다 ${u.app>=u.share?'높은':'낮은'} 시장입니다.`];
  if(dv<0)ul.push(`LG 가전 가구 중 ThinQ를 쓰는 비율이 17개 시장 평균보다 ${red(-dv+'%p')} 낮습니다. 시장 분석의 경쟁 앱 비교에서 이유를 찾아보세요.`);
  $('ud-sum').innerHTML=asum(ul);
  $('ud-tiles').innerHTML=[
    donut('LG 가전 점유율',u.share,'LG','기타 브랜드','이 나라 가전 시장에서 LG가 차지하는 비중',''),
    donut('ThinQ 앱 점유율',u.app,'ThinQ','기타 스마트홈 앱','스마트홈 앱 사용자 중 ThinQ 비중',''),
    donut('점유율 대비 사용률',r,'ThinQ 사용','미사용',`LG 가전 가구 중 ThinQ를 쓰는 비율 · 17개 시장 평균 ${avg}%`,`<span class="delta ${dv<0?'down':'up'}">평균 대비 ${dv>0?'+':''}${dv}%p</span>`),
  ].join('');

  // 이슈 상세 분석: 국가별 이슈 집중도 (로그 눈금, 1.0 = 17개 시장 평균)
  const rows=Object.entries(d.lifts).map(([t,l])=>({t,l,c:cands.find(x=>x.t===t)})).sort((a,b)=>b.l-a.l);
  const up=rows.filter(r=>r.c),low=rows.filter(r=>!r.c&&r.l<LOW),mid=rows.filter(r=>!r.c&&r.l>=LOW);
  const total=rows.length;
  $('is-sum').innerHTML=asum([
    `이번 실행에서 AI가 만든 이슈 ${red(total+'개')} 중 기준(이슈 집중도 ≥ ${THR}, 잔차 ≥ ${RESID_THR})을 넘어 쏠린 것은 ${red(up.length+'개')}입니다.`,
    (low.length?`${low.map(r=>esc(r.t)).join(', ')}은(는) 평균의 절반 이하로 적게 언급되고, `:'')+`나머지 ${mid.length}개는 평균 수준이라 접어 두었습니다.`
  ]);
  const L0=Math.log2(0.18),L1=Math.log2(5.6),pos=(v: number)=>(Math.log2(Math.max(0.18,Math.min(5.6,v)))-L0)/(L1-L0)*100;
  const sc=cands[sel];
  const bar=(r: typeof rows[number])=>{const a=pos(Math.min(1,r.l)),b=pos(Math.max(1,r.l));
    const cls=r.l<1?'lo':r.c===sc?'hi':'up';
    return `<i class="bar ${cls}" style="left:${a}%;width:${Math.max(.6,b-a)}%"></i>`};
  const row=(r: typeof rows[number])=>`<div class="cr${r.c?' c1':''}${r.c&&r.c===sc?' on':''}"${r.c?` role="button" tabindex="0" data-t="${esc(r.t)}"`:''}>
      <span class="nm"><b>${esc(r.t)}</b>${r.c?badge(r.c.v):''}</span><div class="ct">${bar(r)}</div><b class="val">${f2(r.l)}</b></div>`;
  const ticks=[0.25,0.5,1,2,4];
  $('dt-topics').innerHTML=`
    <div class="cr ax"><span class="nm"></span><div class="ct">${ticks.map(t=>`<span class="tk${t===1?' one':''}" style="left:${pos(t)}%">${t===1?'1.0':t}</span>`).join('')}<span class="tk thr" style="left:${pos(THR)}%">기준 ${THR}</span></div><span class="val"></span></div>
    <div class="cbody">
      <div class="grid-l">${ticks.map(t=>`<i class="${t===1?'one':''}" style="left:${pos(t)}%"></i>`).join('')}<i class="thr" style="left:${pos(THR)}%"></i></div>
      <div class="cg">기준을 넘어 쏠린 이슈 <em>${up.length}개</em></div>${up.map(row).join('')||'<div class="cnone">없음</div>'}
      ${low.length?`<div class="cg">평균보다 적게 언급된 이슈 <em>${low.length}개</em></div>${low.map(row).join('')}`:''}
      ${mid.length?`<button type="button" class="cmid" id="cc-mid" aria-expanded="${showAvg}">${showAvg?'▾':'▸'}  <b>평균 수준 이슈 ${mid.length}개</b>  ·  ${mid.map(r=>esc(r.t)).join(', ')}</button>${showAvg?mid.map(row).join(''):''}`:''}
    </div>
    <p class="cfoot">분석 제외: 긍정 리뷰 · 기타 기능 요청</p>`;
  if(mid.length)$('cc-mid').onclick=()=>{showAvg=!showAvg;draw();$('cc-mid').focus()};
  $('dt-topics').querySelectorAll<HTMLElement>('.cr.c1').forEach(b=>{const go2=()=>{sel=cands.findIndex(x=>x.t===b.dataset.t);draw()};b.onclick=go2;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go2()}}});

  // 근거 리뷰: 샘플 원문이 있으면 그대로, 없으면 자리 표시
  $('rv-sub').textContent=sc?`${sc.t} · 1–2점 · 장애 구간 제외`:'현지화 니즈 없음';
  const rv=sc?(REV[name]||[]).filter(x=>x.t===sc.t).slice(0,3):[];
  const stars=(s: number)=>`<span class="stars">${'★'.repeat(s)}<span class="off">${'★'.repeat(5-s)}</span></span>`;
  $('dt-reviews').innerHTML=rv.length
    ?rv.map(x=>`<div class="rv2"><div class="meta">${stars(x.s)}<span>${esc(x.lang)} · ${esc(x.at)}</span></div><p>${esc(x.x)}</p></div>`).join('')
    :[1,1,2].map((s,k)=>`<div class="rv2"><div class="meta">${stars(s)}<span>${esc(name)} · 2026.09</span></div><i class="ln" style="width:${92-k*9}%"></i><i class="ln" style="width:${70-k*12}%"></i></div>`).join('');
}

// 도넛 차트 한 개 (빨강 = LG·ThinQ, 회색 = 나머지)
function donut(title: string, pct: number, main: string, rest: string, sub: string, extra: string){
  const R=38,C=2*Math.PI*R,a=pct/100*C,g=1.2;
  return `<figure class="dn2">
    <figcaption>${title}${extra}</figcaption>
    <svg viewBox="0 0 100 100" role="img" aria-label="${title} ${pct}%">
      <circle cx="50" cy="50" r="${R}" class="d-rest" stroke-dasharray="${Math.max(0,C-a-g*2)} ${C}" stroke-dashoffset="${-(a+g)}" transform="rotate(-90 50 50)"><title>${rest} ${100-pct}%</title></circle>
      <circle cx="50" cy="50" r="${R}" class="d-main" stroke-dasharray="${a} ${C}" transform="rotate(-90 50 50)"><title>${main} ${pct}%</title></circle>
      <text x="50" y="57" text-anchor="middle" class="d-val">${pct}%</text>
    </svg>
    <div class="dn2-r">
      <ul><li class="me"><i></i>${main}<b>${pct}%</b></li><li><i></i>${rest}<b>${100-pct}%</b></li></ul>
      <p>${sub}</p>
    </div>
  </figure>`;
}

$('vt-ai').onclick=()=>{setTab('ai');window.scrollTo(0,0)};
$('vt-data').onclick=()=>{setTab('data');window.scrollTo(0,0)};
$('view-mk').querySelector('.vtabs')!.addEventListener('keydown',(e: KeyboardEvent)=>{
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  const n=tab==='ai'?'data':'ai';setTab(n);$(n==='ai'?'vt-ai':'vt-data').focus();
});

// 라우터가 #voc 를 보여 줄 때 호출: #voc.3 이면 4번째 시장, 숫자가 없으면 보던 시장 그대로
export function onShow(param){
  if(param!==''&&!isNaN(+param)){const i=Math.max(0,Math.min(M.length-1,+param));if(i!==cur){sel=0;showAvg=false}cur=i}
  draw();
}
// 다크 모드 전환 등으로 다시 그릴 때 (market-overview.ts 에서도 씁니다)
export function redrawDetail(){if(!$('view-mk').hidden)draw()}
