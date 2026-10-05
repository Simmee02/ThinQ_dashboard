// 글로벌 VoC 동향 하단 '시장 현황': 문제 유형 요약 막대 + 시장별 집중 이슈 표
import { V, M, col, ink, fill } from '../data/markets';
import type { MarketRow } from '../data/markets';
import { redrawDetail } from './market';

let filter=null;
const count=id=>M.filter(m=>m[5]===id).length;
const LMAX=4;
// 예시 데이터: 캘린더에서 고른 기간에 맞춰 리뷰 수·이슈 집중도·불만 비율을 임의로 늘리고 줄인다 (분류는 그대로)
const jit=(i,k,from,to)=>{const x=Math.sin((i+1)*12.9898+k*78.233+from*0.37+to*0.91)*43758.5453;return x-Math.floor(x)};
function rows(){
  const r=window.__vocRange;
  const all=M.map((m,i)=>({m,i}));
  if(!r)return all;
  const ratio=(r.to-r.from+1)/r.total;
  return all.map(({m,i})=>{
    const [name,small,n,topic,lift,vid,rate]=m;
    const n2=Math.max(1,Math.round(n*ratio*(0.8+0.4*jit(i,1,r.from,r.to))));
    const lift2=lift?Math.min(LMAX-0.05,Math.max(0.3,lift*(0.7+0.6*jit(i,2,r.from,r.to)))):lift;
    const rate2=Math.min(95,Math.max(20,rate+(jit(i,3,r.from,r.to)-0.5)*14));
    return {m:[name,small,n2,topic,lift2,vid,rate2] as MarketRow,i};
  }).sort((a,b)=>(b.m[4]||0)-(a.m[4]||0));
}

function draw(){
  const bar=document.getElementById('vbar'),keys=document.getElementById('vkeys');
  bar.innerHTML='';keys.innerHTML='';
  V.forEach(v=>{
    const n=count(v.id);if(!n)return;
    const b=document.createElement('button');b.className='vseg'+(filter&&filter!==v.id?' dim':'');b.id='vseg-'+v.id;
    b.style.flex=String(n);b.style.background=fill(v);b.style.color=ink(v);
    b.innerHTML=`<span>${n>=2?v.name:''}</span><b>${n}</b>`;
    b.title=`${v.name} ${n}개 시장`;b.setAttribute('aria-label',`${v.name} ${n}개 시장`);
    b.onclick=()=>{filter=filter===v.id?null:v.id;draw()};
    bar.appendChild(b);
    const k=document.createElement('button');k.className='vkey';k.id='vkey-'+v.id;k.setAttribute('aria-pressed',filter===v.id);
    k.innerHTML=`<i style="background:${fill(v)};${v.id==='none'?'box-shadow:inset 0 0 0 1px var(--line-2)':''}"></i>${v.name} <b>${n}</b>`;
    k.onclick=b.onclick;keys.appendChild(k);
  });
  const common=count('wide')+count('group')+count('part');
  const judged=M.length-count('none');
  const tip=t=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/></svg><span><b class="tip-k">에이전트의 팁 :</b> ${t}</span>`;
  document.getElementById('vread').innerHTML=tip(filter
    ?`<b>${V.find(v=>v.id===filter).name}</b> ${count(filter)}개 시장만 표시 중 · 같은 항목을 다시 누르면 전체 보기`
    :`장벽 후보가 있는 ${judged}개 시장 중 <b>${common}개</b>는 1순위 장벽이 여러 시장에 공통으로 나타나고, 그 시장에서만 두드러지는 시장 특이 불만 후보는 <b>${count('special')}개</b>입니다. 비교할 이웃이 없는 단독 시장은 ${count('solo')}개입니다.`);

  const body=document.getElementById('mk-body');body.innerHTML='';
  rows().forEach(({m,i},rk)=>{
    const [name,small,n,topic,lift,vid,rate]=m,v=V.find(x=>x.id===vid);
    const tr=document.createElement('tr');tr.dataset.i=String(i);tr.title='눌러서 시장 상세 보기';if(filter&&filter!==vid)tr.className='hide';
    const pillStyle=vid==='none'?'background:transparent;border-color:var(--line-2);color:var(--ink-3)':`background:color-mix(in oklab, ${col(v)} 16%, var(--surface));color:var(--ink)`;
    tr.innerHTML=`<td class="rk">${rk+1}</td>
      <td><div class="mname">${name}${small?'<span class="small-badge">리뷰 적음</span>':''}</div></td>
      <td class="topic">${topic||'<span class="dash">—</span>'}</td>
      <td>${lift?`<div class="lift"><div class="track"><div class="fill" style="width:${lift/LMAX*100}%;opacity:${small?.45:1}"></div><div class="one" style="left:${100/LMAX}%"></div></div><b>${lift.toFixed(2)}</b></div>`:'<span class="dash">—</span>'}</td>
      <td><span class="pill" style="${pillStyle}"><i style="background:${fill(v)}"></i>${v.name}</span></td>
      <td class="r num">${n.toLocaleString('ko-KR')}</td>`;
    body.appendChild(tr);
  });
}
const redraw=()=>{draw();redrawDetail()};
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redraw)}catch(e){}
new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
draw();
window.addEventListener('voc-range',draw);
