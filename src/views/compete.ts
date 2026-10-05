// 시장 분석(#market): 언어권 드롭다운 → 점유율 도넛 · 경쟁 앱 장단점 · ThinQ의 기회
// 숫자는 모두 ## 목업데이터 (src/data/competitors.ts, src/data/usage.ts)
import { M } from '../data/markets';
import { USAGE } from '../data/usage';
import { APPS, SHARE } from '../data/competitors';
import { esc, AGENT_ICON } from '../shared/ui';
import { go, setParam, currentRoute } from '../router';

const $=(id: string)=>document.getElementById(id)!;
const tip=(t: string)=>`<div class="mk-tip">${AGENT_ICON}<span><b class="tip-k">에이전트의 팁 :</b> ${t}</span></div>`;
let cur=0;

// 시장의 앱 점유율 목록: 경쟁 앱 + ThinQ + 기타, 큰 순
function shares(name: string){
  const list=SHARE[name].map(([app,v])=>({app,v,me:false}));
  list.push({app:'ThinQ',v:USAGE[name].app,me:true});
  list.sort((a,b)=>b.v-a.v);
  const rest=100-list.reduce((s,x)=>s+x.v,0);
  return {list,rest,rank:list.findIndex(x=>x.me)+1};
}

// 도넛: segs 순서대로 그리고 me 조각만 빨간색, 조각 사이 2px 틈
function donut(title: string, segs: {label: string; v: number; me: boolean}[], center: string){
  const R=38,C=2*Math.PI*R,g=1.2;let off=0;
  const arcs=segs.map(s=>{const len=s.v/100*C;const a=`<circle cx="50" cy="50" r="${R}" class="${s.me?'d-main':'d-rest'}" stroke-dasharray="${Math.max(0,len-g)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"><title>${esc(s.label)} ${s.v}%</title></circle>`;off+=len;return a}).join('');
  return `<figure class="dn"><figcaption>${title}</figcaption><div class="dn-body">
    <svg viewBox="0 0 100 100" role="img" aria-label="${title}">${arcs}<text x="50" y="55" text-anchor="middle" class="d-val">${center}</text></svg>
    <ul class="dn-key col">${segs.map(s=>`<li class="${s.me?'me':''}"><i class="k ${s.me?'main':''}"></i>${esc(s.label)}<b>${s.v}%</b></li>`).join('')}</ul>
  </div></figure>`;
}

// 언어권 드롭다운 (시장 목록 대신)
function list(){
  const box=$('cp-select') as HTMLSelectElement;
  if(!box.options.length){
    box.innerHTML=M.map((m,i)=>`<option value="${i}">${m[0]}</option>`).join('');
    box.onchange=()=>go('market',box.value);
  }
  box.value=String(cur);
}

function detail(){
  if(currentRoute()==='market')setParam(String(cur));
  list();
  const name=M[cur][0],u=USAGE[name],sh=shares(name),comps=sh.list.filter(x=>!x.me);
  $('cp-name').textContent=name;
  $('cp-rank').innerHTML=`<span class="rank-b">ThinQ 앱 점유율 ${sh.rank}위</span>`;
  $('cp-to-voc').onclick=()=>go('voc',String(cur));
  $('cp-donuts').innerHTML=
    donut('스마트홈 앱 점유율',[...sh.list.map(x=>({label:x.app,v:x.v,me:x.me})),{label:'기타',v:sh.rest,me:false}],`${u.app}%`)
    +donut('LG 가전 점유율',[{label:'LG',v:u.share,me:true},{label:'기타 브랜드',v:100-u.share,me:false}],`${u.share}%`);
  const gap=u.share-u.app;
  $('cp-share-tip').innerHTML=tip(gap>0
    ?`${esc(name)}에서 LG 가전 점유율은 ${u.share}%인데 ThinQ 앱 점유율은 ${u.app}%입니다. LG 가전을 쓰면서 다른 앱을 쓰는 고객이 있다는 뜻일 수 있어, 1위 앱 <b>${esc(comps[0].app)}</b>의 강점부터 보세요.`
    :`${esc(name)}에서 ThinQ 앱 점유율(${u.app}%)이 LG 가전 점유율(${u.share}%) 이상입니다. 경쟁 앱 약점을 파고들어 격차를 유지하는 쪽이 우선입니다.`);
  $('cp-apps').innerHTML=comps.map((x,k)=>{const a=APPS[x.app];return `<div class="cp-app">
      <div class="cp-app-h"><span class="no">${k+1}</span><b>${esc(x.app)}</b><span class="sh">점유율 ${x.v}%</span></div>
      <div class="pc"><div><em>강점</em>${a.pros.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div><em>약점</em>${a.cons.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>
    </div>`}).join('');
  $('cp-chance').innerHTML=`<div class="cp-two">
      <div><div class="ag-h">배울 점 · 경쟁 앱 강점</div><ul>${comps.slice(0,2).map(x=>`<li><b>${esc(x.app)}</b> ${esc(APPS[x.app].pros[0])}</li>`).join('')}</ul></div>
      <div><div class="ag-h">파고들 점 · 경쟁 앱 약점</div><ul>${comps.slice(0,2).map(x=>`<li><b>${esc(x.app)}</b> ${esc(APPS[x.app].cons[0])}</li>`).join('')}</ul></div>
    </div>${tip(`경쟁 앱의 약점이 ${esc(name)} ThinQ 리뷰에도 나타나는지 <b>VoC 분석</b>에서 확인하면, 우리가 먼저 고칠지 차별점으로 내세울지 정할 수 있습니다.`)}`;
}

// #market.3 이면 4번째 시장, 숫자가 없으면 보던 시장 그대로
export function onShow(param){
  if(param!==''&&!isNaN(+param))cur=Math.max(0,Math.min(M.length-1,+param));
  detail();
}
