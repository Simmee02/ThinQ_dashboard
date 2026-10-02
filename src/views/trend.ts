// 글로벌 VoC 동향(#trend): 요약 카드, 언어권 칩, 기간 달력, 리뷰 수·평균 별점 그래프
// views/trend.html 이 문서에 들어간 뒤 main.js 가 이 모듈을 불러옵니다.
const GROUPS=[
  {id:'en',name:'영어권',total:24375,rate:.646,c:'var(--s1)'},
  {id:'es',name:'스페인어권',total:12647,rate:.49,c:'var(--s2)'},
  {id:'br',name:'브라질',total:12285,rate:.479,c:'var(--s3)'},
  {id:'kr',name:'한국',total:4431,rate:.657,c:'var(--s4)'},
  {id:'etc',name:'기타',total:19302,rate:.58,c:'var(--s5)'}
];
const EVENTS={'2026-07-07':'7/7 23:30','2026-07-12':'7/12 23:10','2026-07-13':'7/13 23:10'};
const SPIKE={'2026-07-07':{kr:140,en:6},'2026-07-08':{kr:210,en:14,etc:8},'2026-07-12':{kr:260,en:10},'2026-07-13':{kr:520,en:22,etc:12},'2026-07-14':{kr:380,en:18,etc:10},'2026-07-15':{kr:90}};

const DAY=864e5, START=Date.UTC(2023,8,24), END=Date.UTC(2026,8,22);
const N=Math.round((END-START)/DAY)+1;
const iso=t=>new Date(t).toISOString().slice(0,10);
const days=Array.from({length:N},(_,i)=>iso(START+i*DAY));
const idx=Object.fromEntries(days.map((d,i)=>[d,i]));

let s=20260928;
const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
// star[g][k][i] = count of (k+1)-star reviews for group g on day i
const star={};
GROUPS.forEach(g=>{
  const st=[0,1,2,3,4].map(()=>new Array(N)),base=[];let w=0;
  for(let i=0;i<N;i++){
    const dow=new Date(START+i*DAY).getUTCDay();
    base[i]=(.65+.7*(i/N))*(1+.18*Math.sin((i/365)*2*Math.PI+(g.id==='kr'?1.2:0)))*((dow===0||dow===6)?1.18:1)*(.6+rnd()*.8);w+=base[i];
  }
  const k=g.total/w;
  for(let i=0;i<N;i++){
    let v=Math.round(base[i]*k);
    // slow drift: complaint share eases ~6%p over the three years
    let r=g.rate+.03-.06*(i/N)+(rnd()-.5)*.16;
    const sp=SPIKE[days[i]];
    if(sp&&sp[g.id]){v+=sp[g.id];r=.93}
    r=Math.min(.98,Math.max(.08,r));
    const p=[.76*r,.24*r,.1*(1-r),.2*(1-r),.7*(1-r)];
    let left=v;
    for(let q=0;q<4;q++){const c=Math.min(left,Math.round(v*p[q]+(rnd()-.5)));st[q][i]=Math.max(0,c);left-=st[q][i]}
    st[4][i]=Math.max(0,left);
  }
  star[g.id]=st;
});

const state={groups:new Set(GROUPS.map(g=>g.id)),g:'day',view:'all',from:idx['2026-07-01'],to:idx['2026-07-21'],pending:false,hover:null,calY:2026,calM:6};
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
const f2=n=>n.toFixed(2);
const dot=d=>d.replace(/-/g,'.');
const md=d=>`${+d.slice(5,7)}/${+d.slice(8,10)}`;
const MAXB=62, MIN_N=5;

function buckets(g,a,b){
  const out=[];let cur=null;
  for(let i=a;i<=b;i++){
    const d=days[i];let key;
    if(g==='day')key=d;
    else if(g==='month')key=d.slice(0,7);
    else{const t=START+i*DAY,dw=(new Date(t).getUTCDay()+6)%7;key=iso(t-dw*DAY)}
    if(!cur||cur.key!==key){cur={key,from:i,to:i};out.push(cur)}else cur.to=i;
  }
  return out;
}
const countB=(g,a,b)=>g==='day'?b-a+1:buckets(g,a,b).length;
// distribution [n1..n5] for a set of groups over [a,b]
function dist(ids,a,b){
  const o=[0,0,0,0,0];
  ids.forEach(id=>{for(let q=0;q<5;q++){const arr=star[id][q];for(let i=a;i<=b;i++)o[q]+=arr[i]}});
  return o;
}
const stats=o=>{const n=o.reduce((x,y)=>x+y,0);return{n,avg:n?(o[0]+2*o[1]+3*o[2]+4*o[3]+5*o[4])/n:null,low:n?(o[0]+o[1])/n:null}};
const sel=()=>[...state.groups];

// chips
const chips=document.getElementById('chips');
GROUPS.forEach(g=>{
  const el=document.createElement('button');
  el.className='chip';el.id='chip-'+g.id;el.innerHTML=`<i style="background:${g.c}"></i>${g.name}`;el.setAttribute('aria-pressed','true');
  el.onclick=()=>{
    if(state.groups.has(g.id)){if(state.groups.size===1)return;state.groups.delete(g.id)}else state.groups.add(g.id);
    el.setAttribute('aria-pressed',state.groups.has(g.id));render();
  };
  chips.appendChild(el);
});
document.querySelectorAll<HTMLButtonElement>('[data-g]').forEach(b=>b.onclick=()=>{if(!b.disabled){state.g=b.dataset.g;render()}});
document.querySelectorAll<HTMLElement>('[data-v]').forEach(b=>b.onclick=()=>{state.view=b.dataset.v;render()});
document.getElementById('prev').onclick=()=>{state.calM--;if(state.calM<0){state.calM=11;state.calY--}renderCal()};
document.getElementById('next').onclick=()=>{state.calM++;if(state.calM>11){state.calM=0;state.calY++}renderCal()};
document.querySelectorAll<HTMLElement>('#presets button').forEach(b=>b.onclick=()=>{
  const p=b.dataset.p;
  if(p==='evt')setRange(idx['2026-07-06'],idx['2026-07-19']);else setRange(N-(+p),N-1);
});

function setRange(a,b){
  state.from=Math.min(a,b);state.to=Math.max(a,b);state.pending=false;state.hover=null;
  if(state.g==='day'&&state.to-state.from+1>MAXB)state.g='week';
  if(state.g==='week'&&countB('week',state.from,state.to)>MAXB)state.g='month';
  const d=days[state.to];state.calY=+d.slice(0,4);state.calM=+d.slice(5,7)-1;
  render();
}
function clickDay(i){
  if(!state.pending){state.from=i;state.to=null;state.pending=true;state.hover=i;paintCal();renderHead();return}
  setRange(state.from,i);
}

function renderHead(){
  const r=document.getElementById('range'),h=document.getElementById('hint');
  if(state.pending){
    r.innerHTML=`${dot(days[state.from])} – <small>종료일을 눌러 주세요</small>`;
    h.innerHTML='<b>종료일</b>을 누르면 기간이 정해집니다. 시작일보다 앞 날짜를 눌러도 됩니다.';
  }else{
    r.innerHTML=`${dot(days[state.from])} – ${dot(days[state.to])}<small>${state.to-state.from+1}일</small>`;
    h.textContent='';
  }
}

let CELLS=[];
function renderCal(){
  const y=state.calY,m=state.calM;
  document.getElementById('cal-title').textContent=`${y}.${String(m+1).padStart(2,'0')}`;
  const first=Date.UTC(y,m,1),dim=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  (document.getElementById('prev') as HTMLButtonElement).disabled=first<=START;
  (document.getElementById('next') as HTMLButtonElement).disabled=Date.UTC(y,m+1,1)>END;
  const lead=(new Date(first).getUTCDay()+6)%7;
  const cal=document.getElementById('cal');cal.innerHTML='';
  ['월','화','수','목','금','토','일'].forEach((d,k)=>{const e=document.createElement('div');e.className='dow'+(k===6?' sun':'');e.textContent=d;cal.appendChild(e)});
  for(let k=0;k<lead;k++)cal.appendChild(document.createElement('div'));
  CELLS=[];
  for(let d=1;d<=dim;d++){
    const key=iso(Date.UTC(y,m,d)),i=idx[key],col=(lead+d-1)%7;
    const cell=document.createElement('div');cell.className='cell';
    const el=document.createElement('button');el.className='day';el.textContent=String(d);el.id='d-'+key;
    if(i===undefined)el.disabled=true;
    else{
      if(EVENTS[key])el.classList.add('evt');
      el.setAttribute('aria-label',`${key}${EVENTS[key]?' 장애 보도일':''}`);
      el.onclick=()=>clickDay(i);
      el.onmouseenter=()=>{if(state.pending){state.hover=i;paintCal()}};
      CELLS.push({cell,el,i,col,first:d===1,last:d===dim});
    }
    cell.appendChild(el);cal.appendChild(cell);
  }
  paintCal();
}
function paintCal(){
  let a=state.from,b=state.to,preview=false;
  if(state.pending){b=state.hover!==null?state.hover:state.from;preview=true;if(b<a)[a,b]=[b,a]}
  CELLS.forEach(({cell,el,i,col,first,last})=>{
    const inB=i>=a&&i<=b&&a!==b;
    cell.classList.toggle('band',inB);cell.classList.toggle('preview',inB&&preview);
    cell.classList.toggle('first',inB&&(i===a||col===0||first));
    cell.classList.toggle('last',inB&&(i===b||col===6||last));
    el.classList.toggle('end',i===a||i===b);
  });
}

const NS='http://www.w3.org/2000/svg';
const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const txt=(svg,x,y,s,a)=>{const t=mk('text',Object.assign({x,y,'font-size':11,fill:'var(--ink-3)','font-family':'var(--mono)'},a||{}));t.textContent=s;svg.appendChild(t);return t};

function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x||1))),f=x/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p}
function renderLine(){
  ['day','week','month'].forEach(g=>{(document.getElementById('g-'+g) as HTMLButtonElement).disabled=countB(g,state.from,state.to)>MAXB});
  document.querySelectorAll<HTMLButtonElement>('[data-g]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===state.g));
  document.querySelectorAll<HTMLElement>('[data-v]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===state.view));
  const list=buckets(state.g,state.from,state.to);
  const tot=list.map(b=>stats(dist(sel(),b.from,b.to)));
  const series: { id: string; name: string; c: string; ids: string[]; w: number; pts?: any[] }[]=state.view==='all'
    ?[{id:'all',name:'평균 별점',c:'var(--accent)',ids:sel(),w:2.5}]
    :GROUPS.filter(g=>state.groups.has(g.id)).map(g=>({id:g.id,name:g.name,c:g.c,ids:[g.id],w:2}));
  series.forEach(sr=>sr.pts=list.map((b,j)=>{const o=sr.id==='all'?tot[j]:stats(dist(sr.ids,b.from,b.to));return{b,...o,ok:o.n>=MIN_N}}));

  const svg=document.getElementById('line');svg.innerHTML='';
  const lab=state.view==='group';
  document.getElementById('lg-line').hidden=lab;
  const L=52,R=lab?120:48,T=34,B=38,Wd=680,H=320,pw=Wd-L-R,ph=H-T-B;
  // right axis: rating 1–5 ; left axis: count, 4 intervals so gridlines are shared
  const yr=v=>T+ph-((v-1)/4)*ph;
  const maxC=Math.max(...tot.map(t=>t.n),1);
  let step=niceStep(maxC/4);if(step*4<maxC)step=niceStep(step*1.01+step);
  const topC=step*4,yc=v=>T+ph-(v/topC)*ph;
  for(let k=0;k<=4;k++){
    const gy=T+ph-k/4*ph;
    svg.appendChild(mk('line',{x1:L,x2:Wd-R+(lab?0:0),y1:gy,y2:gy,stroke:'var(--line)','stroke-width':1}));
    txt(svg,L-8,gy+4,fmt(step*k),{'text-anchor':'end'});
    txt(svg,Wd-R+8,gy+4,(1+k).toFixed(1),{fill:'var(--accent-ink)'});
  }
  txt(svg,4,T-14,'리뷰 수(건)',{'font-family':'var(--sans)',fill:'var(--ink-2)'});
  txt(svg,Wd-R+8,T-14,'별점',{'font-family':'var(--sans)',fill:'var(--accent-ink)'});

  const n=list.length,slot=pw/n,x=j=>L+slot*j+slot/2,bw=Math.max(3,Math.min(30,slot*.56));
  const every=Math.max(1,Math.ceil(n/9));
  const bars=[];
  list.forEach((b,j)=>{
    const c=tot[j].n,top=yc(c),r=Math.min(4,bw/2,yc(0)-top),cx=x(j);
    const d=`M${cx-bw/2},${yc(0)} V${top+r} Q${cx-bw/2},${top} ${cx-bw/2+r},${top} H${cx+bw/2-r} Q${cx+bw/2},${top} ${cx+bw/2},${top+r} V${yc(0)} Z`;
    const p=mk('path',{d,fill:'var(--bar)'});svg.appendChild(p);bars.push(p);
    if(j%every===0)txt(svg,cx,H-14,state.g==='month'?`${b.key.slice(2,4)}.${b.key.slice(5,7)}`:md(days[b.from]),{'text-anchor':'middle'});
  });
  Object.keys(EVENTS).forEach(e=>{
    const j=list.findIndex(b=>idx[e]>=b.from&&idx[e]<=b.to);
    if(j>=0)svg.appendChild(mk('path',{d:`M${x(j)-4},${T-6} h8 l-4,6 z`,fill:'var(--accent)'}));
  });
  svg.appendChild(mk('line',{x1:L,x2:Wd-R,y1:yc(0),y2:yc(0),stroke:'var(--line-2)'}));
  const ends=[];
  series.forEach(sr=>{
    let d='',pen=false;
    sr.pts.forEach((p,j)=>{if(p.ok){d+=(pen?'L':'M')+x(j)+','+yr(p.avg);pen=true}else pen=false});
    svg.appendChild(mk('path',{d,fill:'none',stroke:sr.c,'stroke-width':sr.w,'stroke-linejoin':'round','stroke-linecap':'round'}));
    if(n<=31)sr.pts.forEach((p,j)=>{if(p.ok)svg.appendChild(mk('circle',{cx:x(j),cy:yr(p.avg),r:3.5,fill:sr.c,stroke:'var(--surface)','stroke-width':1.5}))});
    const last=[...sr.pts].reverse().find(p=>p.ok);
    if(last)ends.push({sr,y:yr(last.avg)});
  });
  if(lab){
    ends.sort((a,b)=>a.y-b.y);
    for(let k=1;k<ends.length;k++)if(ends[k].y-ends[k-1].y<14)ends[k].y=ends[k-1].y+14;
    ends.forEach(e=>{svg.appendChild(mk('circle',{cx:Wd-R+46,cy:e.y,r:4,fill:e.sr.c}));txt(svg,Wd-R+54,e.y+4,e.sr.name,{fill:'var(--ink-2)','font-family':'var(--sans)'})});
  }
  const tip=document.getElementById('line-tip'),box=document.getElementById('line-box');
  let hov=-1;
  const hit=mk('rect',{x:L,y:T,width:pw,height:ph,fill:'transparent'});svg.appendChild(hit);
  hit.addEventListener('mousemove',ev=>{
    const rect=svg.getBoundingClientRect(),sc=rect.width/Wd,px=(ev.clientX-rect.left)/sc;
    const j=Math.max(0,Math.min(n-1,Math.floor((px-L)/slot)));
    if(hov>=0)bars[hov].setAttribute('fill','var(--bar)');hov=j;bars[j].setAttribute('fill','var(--bar-hover)');
    const b=list[j];
    const head=state.g==='day'?days[b.from]:`${days[b.from]} – ${days[b.to]}`;
    tip.innerHTML=`${head}<div class="row"><i style="background:var(--bar);border-radius:2px"></i>리뷰 수 <b>${fmt(tot[j].n)}건</b></div>`+series.map(sr=>{const p=sr.pts[j];return`<div class="row"><i style="background:${sr.c}"></i>${sr.name} <b>${p.ok?f2(p.avg)+'점':'표본 부족'}</b>${sr.id==='all'?'':`<span class="n">${fmt(p.n)}건</span>`}</div>`}).join('');
    const cx=x(j)*sc-box.scrollLeft,right=cx<box.clientWidth/2;
    tip.style.left=cx+'px';tip.style.top=(T*sc)+'px';tip.style.transform=right?`translate(${slot*sc/2+8}px,0)`:`translate(calc(-100% - ${slot*sc/2+8}px),0)`;tip.style.opacity='1';
  });
  hit.addEventListener('mouseleave',()=>{tip.style.opacity='0';if(hov>=0)bars[hov].setAttribute('fill','var(--bar)');hov=-1});
  const miss=series.some(sr=>sr.pts.some(p=>!p.ok));
  document.getElementById('line-cap').textContent=(miss?`리뷰가 ${MIN_N}건 미만인 구간은 별점 선을 끊었습니다. `:'')+'위쪽 빨간 삼각형은 장애 보도일입니다.';
}

function periodSA(){
  const S=stats(dist(sel(),state.from,state.to)),A=stats(dist(sel(),0,N-1));
  return{S,A};
}

function renderStats({S,A}){
  const list=buckets(state.g,state.from,state.to).map(b=>({b,...stats(dist(sel(),b.from,b.to))})).filter(p=>p.n>=MIN_N);
  const worst=list.reduce((m,p)=>!m||p.avg<m.avg?p:m,null);
  const unit={day:'날',week:'주',month:'달'}[state.g];
  const dAvg=S.avg-A.avg,dLow=(S.low-A.low)*100;
  const wl=worst?(state.g==='month'?worst.b.key:md(days[worst.b.from])+(state.g==='week'?' 주':'')):'—';
  document.getElementById('stats').innerHTML=[
    ['평균 별점',S.avg?`${f2(S.avg)}<small> / 5</small>`:'—',S.avg?`전체 기간 ${f2(A.avg)} 대비 <span class="${dAvg<0?'down':''}">${dAvg>0?'+':''}${f2(dAvg)}</span>`:''],
    ['1–2점 비중',S.low!==null?(Math.round(S.low*1000)/10)+'%':'—',S.low!==null?`전체 기간 대비 <span class="${dLow>0?'down':''}">${dLow>0?'+':''}${dLow.toFixed(1)}%p</span>`:''],
    ['별점이 가장 낮았던 '+unit,wl,worst?`평균 ${f2(worst.avg)}점 · ${fmt(worst.n)}건`:''],
    ['총 리뷰 수',fmt(S.n)+'건',`${state.to-state.from+1}일 (하루 평균 ${fmt(S.n/(state.to-state.from+1))}건)`]
  ].map(([k,v,d])=>`<div class="stat"><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join('');
  const hits=Object.keys(EVENTS).filter(e=>idx[e]>=state.from&&idx[e]<=state.to);
  // const note=document.getElementById('note');
  // if(hits.length){note.hidden=false;note.innerHTML=`<b>2026년 7월 ThinQ 접속 장애 포함</b> · ${hits.map(h=>EVENTS[h]).join(', ')} 시작 (오류코드 E1031).`}
  // else note.hidden=true;
}

function render(){renderHead();renderCal();if(state.to!==null){renderLine();renderStats(periodSA());window.__vocRange={from:state.from,to:state.to,total:N};window.dispatchEvent(new Event('voc-range'))}}
window.addEventListener('resize',()=>{document.querySelectorAll<HTMLElement>('.tip').forEach(t=>t.style.opacity='0')});
render();
export function onShow() {}
