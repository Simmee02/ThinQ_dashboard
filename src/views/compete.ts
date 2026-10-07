// 시장 분석(#market): 언어권 드롭다운 → 점유율(도넛 2개 + LG 가전 대비 ThinQ 앱 사용률) · 경쟁 앱 VoC 분석(장단점)
// 숫자는 모두 ## 목업데이터 (src/data/competitors.ts, src/data/usage.ts)
import { M } from '../data/markets';
import { USAGE, ratio, RATIO_AVG } from '../data/usage';
import { APPS, SHARE } from '../data/competitors';
import { esc, AGENT_ICON } from '../shared/ui';
import { go, setParam, currentRoute } from '../router';

const $=(id: string)=>document.getElementById(id)!;
let cur=0;
const red=(t: string)=>`<b class="em">${t}</b>`;
const CHECK='<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="9" class="bg"/><path d="M5.3 9.2 7.8 11.6 12.7 6.7"/></svg>';
const CROSS='<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="9" class="bg"/><path d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6"/></svg>';

// 시장의 앱 점유율 목록: 경쟁 앱 + ThinQ + 기타, 큰 순
function shares(name: string){
  const list=SHARE[name].map(([app,v])=>({app,v,me:false}));
  list.push({app:'ThinQ',v:USAGE[name].app,me:true});
  list.sort((a,b)=>b.v-a.v);
  const rest=100-list.reduce((s,x)=>s+x.v,0);
  return {list,rest,rank:list.findIndex(x=>x.me)+1};
}

// 도넛: segs 순서대로 그리고 me 조각만 빨간색, 조각 사이 틈
function donut(title: string, segs: {label: string; v: number; me: boolean}[], center: string){
  const R=38,C=2*Math.PI*R,g=1.2;let off=0;
  const arcs=segs.map(s=>{const len=s.v/100*C;const a=`<circle cx="50" cy="50" r="${R}" class="${s.me?'d-main':'d-rest'}" stroke-dasharray="${Math.max(0,len-g)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"><title>${esc(s.label)} ${s.v}%</title></circle>`;off+=len;return a}).join('');
  return `<figure class="dn2"><figcaption>${title}</figcaption>
    <svg viewBox="0 0 100 100" role="img" aria-label="${title}">${arcs}<text x="50" y="57" text-anchor="middle" class="d-val">${center}</text></svg>
    <div class="dn2-r"><ul>${segs.map(s=>`<li class="${s.me?'me':''}"><i></i>${esc(s.label)}<b>${s.v}%</b></li>`).join('')}</ul></div>
  </figure>`;
}

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
  const name=M[cur][0],u=USAGE[name],sh=shares(name),comps=sh.list.filter(x=>!x.me),low=ratio(u)<RATIO_AVG;
  $('cp-rank').innerHTML=`<span class="vd v-wide">ThinQ 앱 점유율 ${sh.rank}위</span>`;
  $('cp-donuts').innerHTML=
    donut('LG 가전 점유율',[{label:'LG',v:u.share,me:true},{label:'기타 브랜드',v:100-u.share,me:false}],`${u.share}%`)
    +donut('스마트홈 앱 점유율',[...sh.list.map(x=>({label:x.app,v:x.v,me:x.me})),{label:'기타',v:sh.rest,me:false}],`${u.app}%`)
    +`<div class="cp-use"><b class="t">LG 가전 대비 ThinQ 앱 사용률</b>
      <div class="row"><span>ThinQ 앱 사용률</span><b>${u.usage}%</b></div><div class="trk"><i style="width:${u.usage}%"></i></div>
      <div class="row"><span>LG 가전 점유율</span><b class="me">${u.share}%</b></div><div class="trk"><i class="me" style="width:${u.share}%"></i></div>
      <p>${low?'LG 가전 점유율에 비해 ThinQ 앱 사용률이 낮습니다.<br>ThinQ 앱 현지화가 필요한 시장으로 보입니다.':'LG 가전 점유율에 비해 ThinQ 앱 사용률이 17개 시장 평균 이상입니다.'}</p></div>`;

  // 경쟁 앱 VoC 분석
  const top=comps[0],me=sh.list.find(x=>x.me)!,gap=top.v-me.v;
  $('cp-sum').innerHTML=`<div class="asum-h">${AGENT_ICON}<b>에이전트 요약</b></div><ul>
    <li>${esc(name)} 스마트홈 앱 시장의 1위 경쟁 앱은 ${red(`${esc(top.app)}(${top.v}%)`)}로, ThinQ(${me.v}%)${gap<0?`와 격차가 ${-gap}%p입니다.`:`보다 ${gap}%p 높습니다.`}</li>
    <li>${comps.slice(0,2).map(x=>`${esc(x.app)}은(는) ${red(esc(APPS[x.app].pros[0]))}`).join(', ')}이(가) 강점으로 꼽힙니다.</li></ul>`;
  $('cp-apps').innerHTML=comps.map((x,k)=>{const a=APPS[x.app];return `<article class="cpa">
      <div class="cpa-h"><span class="logo" aria-hidden="true">${esc(x.app[0])}</span><div><b>${esc(x.app)}</b><span>${k+1}위 경쟁 앱</span></div><div class="sh"><b>${x.v}%</b><span>점유율</span></div></div>
      <div class="trk"><i style="width:${x.v}%"></i></div>
      <div class="pc2"><div><em class="pro">강점</em><ul>${a.pros.map(t=>`<li class="pro">${CHECK}${esc(t)}</li>`).join('')}</ul></div>
        <div><em class="con">약점</em><ul>${a.cons.map(t=>`<li class="con">${CROSS}${esc(t)}</li>`).join('')}</ul></div></div>
    </article>`}).join('');
}

// #market.3 이면 4번째 시장, 숫자가 없으면 보던 시장 그대로
export function onShow(param){
  if(param!==''&&!isNaN(+param))cur=Math.max(0,Math.min(M.length-1,+param));
  detail();
}
