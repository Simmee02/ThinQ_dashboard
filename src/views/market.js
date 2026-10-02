// 국가별 시장 분석(#market): 시장 목록, 기본 정보, 국가별 이슈 집중도, 자동 요약
import { M, V, fill, col } from '../data/markets.js';
import { go, setParam, currentRoute } from '../router.js';

const TOPICS=['연결 끊김·재연동','세탁기·건조기','에어컨·냉장고 제어','TV 제어·미러링','TV-앱 연동·펌웨어'];
const BULB='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/></svg>';
let cur=0,per='w';
let s=77;const rnd=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646};
// example lifts for the non-max topics (kept below the demo's max value)
const EX=M.map(m=>TOPICS.map(t=>t===m[3]?m[4]:+(0.5+rnd()*Math.min(1.1,(m[4]||1.3)-0.55)).toFixed(2)));
const CHG=M.map(()=>({d:+((rnd()-.5)*.5).toFixed(2),w:+((rnd()-.5)*.3).toFixed(2),m:+((rnd()-.5)*.2).toFixed(2)}));
const avg=r=>{r/=100;return .76*r*1+.24*r*2+(1-r)*(.1*3+.2*4+.7*5)};
const $=id=>document.getElementById(id);
const pill=v=>`<span class="pill" style="${v.id==='none'?'background:transparent;border-color:var(--line-2);color:var(--ink-3)':`background:color-mix(in oklab, ${col(v)} 16%, var(--surface));color:var(--ink)`}"><i style="background:${fill(v)}"></i>${v.name}</span>`;

function list(){
  const box=$('mlist');box.innerHTML='';
  M.forEach((m,i)=>{
    const v=V.find(x=>x.id===m[5]);
    const b=document.createElement('button');b.className='mi';b.id='mi-'+i;b.setAttribute('aria-current',i===cur);
    b.innerHTML=`<i style="background:${fill(v)};${v.id==='none'?'box-shadow:inset 0 0 0 1px var(--line-2)':''}"></i><span class="nm">${m[0]}</span><span class="lv">${m[4]?m[4].toFixed(2):'—'}</span>`;
    b.onclick=()=>{cur=i;draw()};box.appendChild(b);
  });
}
function draw(){
  if(currentRoute()==='market')setParam(String(cur));
  list();
  const [name,small,n,topic,lift,vid,rate]=M[cur],v=V.find(x=>x.id===vid);
  $('dt-name').textContent=name;$('dt-pill').innerHTML=pill(v);
  $('dt-small').innerHTML=small?'<span class="small-badge">리뷰 적음</span>':'';
  const same=M.filter((x,i)=>i!==cur&&x[3]&&x[3]===topic);
  $('dt-kv').innerHTML=[
    ['문제 유형',v.name,''],['집중 이슈',topic||'—',''],['국가별 이슈 집중도',lift?lift.toFixed(2):'—','n'],
    ['분석 리뷰 수',n.toLocaleString('ko-KR')+'건','n'],['이슈 집중도 순위',lift?`17개 시장 중 ${cur+1}위`:'—',''],['불만 리뷰 비율(참고)',rate.toFixed(1)+'%','n']
  ].map(([k,val,c])=>`<div><span>${k}</span><b class="${c}">${val}</b></div>`).join('');
  // topics
  const LM=4,t=$('dt-topics');
  if(!topic){t.innerHTML='<div class="empty-note">문제 유형가 정해지지 않은 시장으로, 국가별 이슈 집중도를 표시하지 않습니다.</div>'}
  else{
    const rows=TOPICS.map((tp,k)=>({tp,l:EX[cur][k]})).sort((a,b)=>b.l-a.l);
    t.innerHTML=rows.map(r=>`<div class="row ${r.tp===topic?'top':''}"><span class="nm">${r.tp}</span><div class="track"><div class="fill" style="width:${r.l/LM*100}%"></div><div class="one" style="left:${100/LM}%"></div></div><b>${r.l.toFixed(2)}</b></div>`).join('')
      +`<div class="mk-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> 예를 들어 ${topic} ${lift.toFixed(2)}는, ${name}에서 이 이슈의 비중이 전체 국가 평균의 ${lift.toFixed(2)}배라는 뜻입니다.</span></div>`;
  }
  // big number
  const a=avg(rate),c=CHG[cur][per],lbl={d:'전날',w:'전주',m:'전달'}[per];
  $('dt-big').innerHTML=`${a.toFixed(2)}<small> / 5</small>`;
  $('dt-chg').className='chg '+(c<0?'dn':c>0?'up':'');
  $('dt-chg').textContent=`${lbl} 대비 ${c>0?'+':''}${c.toFixed(2)}`;
  document.querySelectorAll('#dt-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===per));
  // summary
  let sum;
  if(!topic)sum=`${name}은(는) 분석 리뷰 ${n.toLocaleString('ko-KR')}건으로 표본이 충분하지만 문제 유형가 보류되었습니다. 보류 사유 확인이 필요합니다.`;
  else{
    sum=`${name}의 집중 이슈는 <b>${topic}</b>이며, 국가별 이슈 집중도는 <b>${lift.toFixed(2)}</b>입니다(전체 국가 평균 1.0). `;
    sum+=same.length?`집중 이슈가 같은 시장은 ${same.length}곳(${same.map(x=>x[0]).join(', ')})이며, 문제 유형는 <b>${v.name}</b>입니다. `:`집중 이슈가 같은 다른 시장은 없으며, 문제 유형는 <b>${v.name}</b>입니다. `;
    if(small)sum+=`분석 리뷰가 ${n.toLocaleString('ko-KR')}건으로 적어 집중도 해석에 주의가 필요합니다.`;
  }
  $('dt-sum').innerHTML=sum;
  // peers
  $('dt-peers').innerHTML=same.length?same.map(x=>{const i=M.indexOf(x),vv=V.find(y=>y.id===x[5]);return`<div class="peer"><i style="width:8px;height:8px;border-radius:2px;background:${fill(vv)}"></i><span class="nm"><button data-i="${i}">${x[0]}</button></span><b>${x[4].toFixed(2)}</b></div>`}).join('')
    :`<div class="empty-note">${topic?'집중 이슈가 같은 다른 시장이 없습니다.':'문제 유형 보류 중으로 비교할 수 없습니다.'}</div>`;
  $('dt-peer-sub').innerHTML=topic?`<div class="mk-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> 주요 집중 이슈가 <b>${topic}</b>인 시장입니다.</span></div>`:'';
  $('dt-peers').querySelectorAll('button').forEach(b=>b.onclick=()=>{cur=+b.dataset.i;draw()});
  // review placeholders
  $('dt-reviews').innerHTML=[1,1,2].map((st,k)=>`<div class="rv"><div class="meta"><span class="stars">${'★'.repeat(st)}<span style="color:var(--line-2)">${'★'.repeat(5-st)}</span></span><span>${topic||'이슈 미정'}</span></div><div class="ln" style="width:${92-k*9}%"></div><div class="ln" style="width:${70-k*12}%"></div></div>`).join('');
}
document.querySelectorAll('#dt-seg button').forEach(b=>b.onclick=()=>{per=b.dataset.p;draw()});


$('mk-body').addEventListener('click',e=>{const tr=e.target.closest('tr');if(!tr)return;go('market',tr.dataset.i)});

// 라우터가 #market 을 보여 줄 때 호출: #market.3 이면 4번째 시장을 엽니다
export function onShow(param){
  if(param!==''&&!isNaN(+param))cur=Math.max(0,Math.min(M.length-1,+param));
  draw();
}
// 다크 모드 전환 등으로 색이 바뀌면 시장 현황 표가 부릅니다
export function redrawDetail(){if(!$('view-mk').hidden)draw()}
