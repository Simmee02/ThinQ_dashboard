// 보고서 생성(#report): A4 보고서, 개발 이슈 초안(GitHub/Jira), 에이전트 활동, 알림 기록
import { TODAY, DEPTS, ST, I, need, deptName, md, prio, LOCALE, scr } from '../data/issues';
import { $, esc, toast, fallbackCopy } from '../shared/ui';
import { go } from '../router';
import a4Css from '../styles/a4.css?raw';
import fontUrl from '../assets/fonts/PretendardSubset.woff2?url';
import { state, closeDrawer } from './issues';

function renderAlerts(){
  const list=[];
  I.forEach(it=>it.events.forEach(e=>{if((e[1]==='mail'&&/발송|전달/.test(e[2]))||e[1]==='reopen')list.push({it,e})}));
  list.sort((a,b)=>b.e[0].localeCompare(a.e[0]));
  $('alerts').innerHTML=list.map(({it,e})=>`<li><button class="al" data-id="${it.id}"><span class="av">${deptName(it.dept).slice(0,1)}</span><span style="min-width:0"><b>${it.title}</b><span class="m">${it.dept==='l10n'?'번역부 · 서비스 기획팀':deptName(it.dept)} · ${md(e[0])}</span></span><span class="pill ${e[1]==='reopen'?'re':'sent'}">${e[1]==='reopen'?'재알림':'발송됨'}</span></button></li>`).join('');
  $('alerts').querySelectorAll('.al').forEach(b=>b.onclick=()=>{const it=I.find(i=>i.id===b.dataset.id);state.f=need(it)?'need':'archive';state.q=null;state.dept='all';go('issues',it.id)});
}

// ---------- 근거 리포트 (A4) ----------
const RPT_TIME='09:05';
const askFor=it=>{
  const base={reopen:'해결 처리 후 다시 늘었습니다. 재발 원인을 확인하고 대응 담당자 지정과 해결 메모 작성을 요청합니다.',new:'새로 생긴 이슈입니다. 대응 담당자 지정과 원인 확인을 요청합니다.',open:'진행 중입니다. 현재 대응 상황을 대시보드에 업데이트해 주세요.',watch:'앱 범위 밖이거나 관찰 중인 이슈입니다. 추가 증가 시 다시 알려 드립니다.',done:'해결된 이슈의 참고 기록입니다.'}[it.status];
  return (it.dept==='l10n'&&it.status!=='done'?'해외 전담 부서가 없어 서비스 기획팀의 검토가 필요합니다. ':'')+base;
};
function reportIssues(){
  const dept=$('rg-dept').value,scope=$('rg-scope').value;
  if(scope==='one'){const it=I.find(i=>i.id===$('rg-issue').value);return it?[it]:[]}
  const v=I.filter(it=>need(it)&&(dept==='all'||it.dept===dept)).sort((a,b)=>prio(b).score-prio(a).score);
  return scope==='top3'?v.slice(0,3):v;
}
function miniBars(it){
  const s=it.series.slice(-30),mx=Math.max(...s.map(p=>p.v),1),W=250,H=46,bw=W/s.length;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${s.map((p,i)=>`<rect x="${(i*bw+1).toFixed(1)}" y="${(H-p.v/mx*(H-4)).toFixed(1)}" width="${Math.max(1,bw-2).toFixed(1)}" height="${(p.v/mx*(H-4)).toFixed(1)}" rx="1" fill="${it.status==='reopen'?'#e10a1e':it.status==='new'?'#c27a00':'#8a8693'}" opacity=".8"/>`).join('')}</svg>`;
}
const built = { text: '', rid: '' };
const outState = { cur: '' };
function buildReport(){
  const list=reportIssues(),dept=$('rg-dept').value,scope=$('rg-scope').value;
  const live=I.filter(it=>need(it)&&(dept==='all'||it.dept===dept));
  const dn=dept==='all'?'전체 부서':deptName(dept);
  const to=$('rg-to').value.trim()||(scope==='one'&&list[0]?(list[0].dept==='l10n'?'서비스 기획팀':deptName(list[0].dept)):(dept==='all'?'ThinQ 서비스 기획팀':(dept==='l10n'?'서비스 기획팀':dn)));
  const scopeName={top3:'우선순위 상위 3건',all:'처리 필요 전체',one:'이슈 1건'}[scope];
  const rid='RPT-'+TODAY.replace(/-/g,'')+'-'+(scope==='one'&&list[0]?list[0].id.slice(4):({top3:'T3',all:'ALL'}[scope]));
  const top=list[0],tp=top?prio(top):null;
  const summary=!list.length?'조건에 맞는 이슈가 없습니다.':scope==='one'
    ?`${top.id} "${top.title}" 이슈의 근거 보고서입니다. 현재 상태는 ${ST[top.status].t}${top.status!=='done'?`, 우선순위는 ${tp.label}(${tp.score}점)`:''}입니다.`
    :`${dn}의 처리 필요 이슈는 ${live.length}건이며, 이 중 재발 ${live.filter(i=>i.status==='reopen').length}건, 신규 ${live.filter(i=>i.status==='new').length}건입니다. 가장 급한 이슈는 ${top.id} "${top.title}"(${tp.label} ${tp.score}점)입니다.`;
  const pr=it=>it.status==='done'?'<span class="r-pr arch">아카이브</span>':(p=>`<span class="r-pr ${p.cls}">${p.label} ${p.score}</span>`)(prio(it));
  const html=`
    <div class="r-top">
      <div><div class="r-brand"><i></i>ThinQ VOC 에이전트 · 이슈 근거 리포트</div><h1>${scope==='one'&&top?esc(top.title):dn+' 이슈 보고'}</h1></div>
      <div class="r-id"><b class="r-mono">${rid}</b>생성 ${TODAY} ${RPT_TIME}<br>작성: 에이전트 자동 생성</div>
    </div>
    <div class="r-meta">
      <div><span>받는 사람</span><b>${esc(to)}</b></div>
      <div><span>대상 부서</span><b>${dn}</b></div>
      <div><span>범위</span><b>${scopeName}</b></div>
      <div><span>데이터 기준</span><b class="r-mono">${TODAY} 09:00 수집</b></div>
    </div>
    <h2>요약</h2>
    <p class="r-sum">${esc(summary)}</p>
    ${scope!=='one'?`<div class="r-kpi"><div><b>${live.length}</b><span>처리 필요</span></div><div><b>${live.filter(i=>i.status==='reopen').length}</b><span>재발</span></div><div><b>${live.filter(i=>i.status==='new').length}</b><span>신규 · 24시간</span></div><div><b>${live.filter(i=>i.dept==='l10n').length}</b><span>담당 없음</span></div></div>`:''}
    ${list.length>1?`<h2>이슈 목록</h2><table><thead><tr><th>#</th><th>이슈</th><th>담당 부서</th><th>상태</th><th>우선순위</th><th>7일</th><th>관련 리뷰</th></tr></thead><tbody>${list.map((it,k)=>`<tr><td class="r-mono">${k+1}</td><td>${esc(it.title)}<br><span class="r-mono" style="color:#9a97a1;font-size:10px">${it.id}</span></td><td>${deptName(it.dept)}</td><td>${ST[it.status].t}</td><td>${pr(it)}</td><td class="r-mono">${it.trend===null?'—':(it.trend>0?'+':'')+it.trend+'%'}</td><td class="r-mono">${it.total.toLocaleString('ko-KR')}</td></tr>`).join('')}</tbody></table>`:''}
    <h2>이슈별 근거</h2>
    ${list.map(it=>{const p=it.status!=='done'?prio(it):null;const last=[...it.series].reverse().find(x=>x.v>0);return `<section class="r-issue">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h3>${esc(it.title)}</h3><div class="r-line"><span class="r-mono">${it.id}</span> · ${esc(it.topic)} · ${deptName(it.dept)}${it.owner?' · 대응 '+esc(it.owner):''}</div></div>${pr(it)}</div>
      <div class="r-why ${it.status==='reopen'?'':'calm'}">${esc(it.why)}</div>
      <div class="r-grid">
        <div>
          <div class="r-lbl">근거 타임라인</div>
          <ul class="r-tl">${it.events.map(e=>`<li class="${e[1]==='hypo'?'hypo':''}"><span>${e[0]}</span><span>${esc(e[2])}${e[3]?' · '+esc(e[3]):''}</span></li>`).join('')}</ul>
          <div class="r-lbl">대표 리뷰</div>
          ${it.reviews.map(r=>`<p class="r-rv"><span>${r[0]} ${'★'.repeat(r[1])}</span>${esc(r[2])}</p>`).join('')}
        </div>
        <div>
          ${it.shot?`<div class="r-lbl">화면 증거 · ${it.shotSrc==='auto'?'자동 재현':'사진'}</div><img src="${it.shot}" alt="" style="max-width:120px;max-height:240px;border-radius:8px;border:1px solid #e6e4ea;display:block;margin-bottom:6px">`:''}
          <div class="r-lbl">일별 관련 리뷰 · 최근 30일</div>
          ${miniBars(it)}
          <table style="margin-top:6px"><tbody>
            <tr><td style="color:#5f5c66">관련 리뷰</td><td class="r-mono">${it.total.toLocaleString('ko-KR')}건</td></tr>
            <tr><td style="color:#5f5c66">처음 발견</td><td class="r-mono">${it.first}</td></tr>
            <tr><td style="color:#5f5c66">마지막 발생</td><td class="r-mono">${last?last.d:'—'}</td></tr>
            <tr><td style="color:#5f5c66">영향 언어권</td><td>${it.langs.join(', ')}</td></tr>
            ${p?`<tr><td style="color:#5f5c66">점수 구성</td><td class="r-mono">${p.parts.map(x=>x[0]+' +'+x[1]).join(' · ')}</td></tr>`:''}
          </tbody></table>
        </div>
      </div>
      <div class="r-ask"><b>요청 사항</b> · ${askFor(it)}</div>
    </section>`}).join('')}
    <div class="r-sign"><div>검토<span></span></div><div>대응 담당<span></span></div><div>확인일<span></span></div></div>
    <div class="r-foot"><span>Google Play 공개 리뷰 · 1시간 주기 수집 · 우선순위 = 상태 + 7일 증가율 + 영향 언어권 + 담당 없음 가산</span></div>`;
  $('a4').innerHTML=html;
  // plain text for copy
  const L=[];L.push(`[ThinQ VOC 이슈 근거 리포트] ${rid}`,`생성 ${TODAY} ${RPT_TIME} · 받는 사람 ${to} · 대상 ${dn} · 범위 ${scopeName}`,'','요약',summary,'');
  list.forEach((it,k)=>{const p=it.status!=='done'?prio(it):null;L.push(`${k+1}. ${it.title} (${it.id})`,`   담당 ${deptName(it.dept)} · 상태 ${ST[it.status].t}${p?` · 우선순위 ${p.label} ${p.score}점`:''} · 관련 리뷰 ${it.total}건 · ${it.langs.join(', ')}`,`   이유: ${it.why}`);it.events.filter(e=>e[1]!=='hypo').forEach(e=>L.push(`   - ${e[0]} ${e[2]}${e[3]?' · '+e[3]:''}`));L.push(`   요청 사항: ${askFor(it)}`,'')});
  built.text=L.join('\n');built.rid=rid;
}
function fillReportControls(){
  const d=$('rg-dept'),cur=d.value||'all';
  d.innerHTML=[{id:'all',name:'전체 부서'},...DEPTS].map(x=>`<option value="${x.id}" ${x.id===cur?'selected':''}>${x.name}</option>`).join('');
  const is=$('rg-issue'),ci=is.value;
  is.innerHTML=[...I].sort((a,b)=>(Number(need(b))-Number(need(a)))||prio(b).score-prio(a).score).map(it=>`<option value="${it.id}" ${it.id===ci?'selected':''}>${it.id} · ${esc(it.title)}${need(it)?'':' (아카이브)'}</option>`).join('');
  $('rg-one-wrap').hidden=$('rg-scope').value!=='one';
  $('rg-dept').disabled=$('rg-scope').value==='one';
}
['rg-dept','rg-scope','rg-issue'].forEach(id=>$(id).addEventListener('change',()=>{fillReportControls();buildReport();if(outState.cur==='dev')buildDev()}));
$('rg-to').addEventListener('input',buildReport);
$('rg-copy').onclick=()=>{const t=built.text||'';try{navigator.clipboard.writeText(t).then(()=>toast('리포트 텍스트를 복사했습니다'),()=>fallbackCopy(t))}catch(e){fallbackCopy(t)}};
$('rg-html').onclick=async()=>{
  let css='',face='';
  css=a4Css;
  try{const blob=await (await fetch(fontUrl)).blob();const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob)});face=`@font-face{font-family:"Pretendard";font-weight:45 920;src:url(${url}) format("woff2")}`}catch(e){}
  const doc=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${built.rid}</title><style>${face}body{margin:0;background:#f5f5f7;padding:24px}${css}</style></head><body>${$('a4').outerHTML}</body></html>`;
  try{const url=URL.createObjectURL(new Blob([doc],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download=built.rid+'.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('HTML 파일로 저장합니다 · 공유 링크 화면에서는 저장이 막힐 수 있어요')}catch(e){toast('이 화면에서는 저장할 수 없습니다. 내려받은 프로젝트 파일에서 다시 시도해 주세요')}
};
$('rg-print').onclick=()=>{toast('인쇄 창에서 "PDF로 저장"을 고르세요');try{window.print()}catch(e){}};


// ---------- 리포트 탭 이동 + 출력 탭 ----------
function setOut(o){
  document.querySelectorAll<HTMLElement>('#view-rp [data-out]').forEach(b=>b.setAttribute('aria-selected',b.dataset.out===o));
  document.querySelectorAll<HTMLElement>('#view-rp [data-for]').forEach(el=>el.hidden=el.dataset.for!==o);
  outState.cur=o;if(o==='dev')buildDev();
}
document.querySelectorAll<HTMLElement>('#view-rp [data-out]').forEach(b=>b.onclick=()=>setOut(b.dataset.out));
function goReport(id,out){closeDrawer();$('rg-scope').value='one';fillReportControls();$('rg-issue').value=id;buildReport();setOut(out);go('report');toast(out==='dev'?`${id} 개발 이슈 초안을 만들었습니다 · A4 보고서 탭도 있어요`:`${id} A4 보고서를 만들었습니다`)}

// ---------- 개발 이슈 초안 (GitHub / Jira) ----------
const DEPT_SLUG={thinq:'thinq-app',aircon:'aircon',washer:'washer',l10n:'localization'};
function devDraft(it){
  const p=it.status!=='done'?prio(it):null,[screen,ok]=scr(it),loc=it.langs.map(l=>LOCALE[l]).filter(Boolean);
  const tag={reopen:'재발',new:'신규',open:'진행',watch:'관찰',done:'해결'}[it.status];
  const title=`[${it.id}][${tag}] ${it.title}`;
  const labels=['voc',DEPT_SLUG[it.dept],p?'priority:'+({p1:'urgent',p2:'high',p3:'normal',p4:'low'}[p.cls]):'archived'];
  if(it.status==='reopen')labels.push('regression');if(it.dept==='l10n')labels.push('i18n');
  const team=it.dept==='l10n'?'번역부 · 서비스 기획팀 (전담 조직 없음)':deptName(it.dept);
  const L=[];
  L.push('## 요약',it.why,'');
  L.push('## 영향 범위',`- 관련 리뷰: ${it.total.toLocaleString('ko-KR')}건 · 최근 7일 증감 ${it.trend===null?'—':(it.trend>0?'+':'')+it.trend+'%'}`,`- 영향 언어권: ${it.langs.join(', ')}`,p?`- 우선순위: ${p.label} ${p.score}점 (${p.parts.map(x=>x[0]+' +'+x[1]).join(' · ')})`:'- 우선순위: 아카이브',`- 처음 발견 ${it.first} · 담당 ${team}`,'');
  L.push('## 재현 조건',`- 화면: ${screen}`,`- 언어·지역: ${loc.join(', ')||'—'}`,'- 기기: Android 14 에뮬레이터 · 앱 최신 버전 (자동 재현 연동 시 실제 값으로 갱신)',`- 자동 재현: ${ok?'가능':'어려움 (수동 확인 필요)'}`,'');
  L.push('## 실제 동작 / 기대 동작',`- 실제: ${it.title}`,'- 기대: (담당자 확인 후 작성)','');
  L.push('## 근거 타임라인',...it.events.filter(e=>e[1]!=='hypo').map(e=>`- ${e[0]} ${e[2]}${e[3]?' · '+e[3]:''}`),'');
  L.push('## 대표 리뷰',...it.reviews.map(r=>`> [${r[0]} ${'★'.repeat(r[1])}] ${r[2]}`),'');
  L.push('## 화면 증거',it.shot?`- ${it.shotSrc==='auto'?'자동 재현':'사진'} 1장 · 이슈 생성 후 파일로 첨부`:'- 사진 없음'+(it.repro?' (재현 요청됨)':''),'');
  L.push('---',`ThinQ VOC 에이전트 자동 생성 · 대시보드 ${it.id} · ${TODAY}`);
  return {title,labels,team,prio:p?`${p.label} ${p.score}점`:'아카이브',md:L.join('\n')};
}
const toJira=md=>md.replace(/^## (.*)$/gm,'h2. $1').replace(/^- /gm,'* ').replace(/^> (.*)$/gm,'bq. $1').replace(/^---$/gm,'----');
const devBuilt = { text: '' };
function buildDev(){
  const one=$('rg-scope').value==='one',it=one?I.find(i=>i.id===$('rg-issue').value):null;
  $('dev-empty').hidden=!!it;$('dev-body').hidden=!it;if(!it)return;
  const d=devDraft(it),jira=$('dev-target').value==='jira',body=jira?toJira(d.md):d.md;
  $('dev-title').textContent=d.title;$('dev-team').textContent=d.team;$('dev-prio').textContent=d.prio;
  $('dev-labels').innerHTML=d.labels.map(l=>`<i>${esc(l)}</i>`).join('');
  $('dev-md').textContent=(jira?'':'# ')+d.title+'\n\n'+body;
  devBuilt.text=d.title+'\n\n'+body;
  const repo=$('dev-repo').value.trim(),valid=/^[\w.-]+\/[\w.-]+$/.test(repo),a=$('dev-open');
  $('dev-repo-wrap').hidden=jira;a.hidden=jira;
  $('dev-note').textContent=jira?'Jira 위키 형식으로 바꿨습니다. 본문 복사 후 Jira 새 티켓의 설명란에 붙여 넣으세요. 사진는 티켓을 만든 뒤 첨부하세요.':(valid?'새 탭에서 제목·본문·라벨이 채워진 GitHub 새 이슈 화면이 열립니다. 라벨은 저장소에 미리 있어야 붙습니다. 캡처는 이슈를 만든 뒤 첨부하세요.':'저장소를 owner/repo 형식으로 입력하면 GitHub 새 이슈 화면을 바로 열 수 있습니다.');
  if(valid){a.href=`https://github.com/${repo}/issues/new?title=${encodeURIComponent(d.title)}&body=${encodeURIComponent(d.md)}&labels=${encodeURIComponent(d.labels.join(','))}`;a.removeAttribute('aria-disabled')}else{a.href='#';a.setAttribute('aria-disabled','true')}
}
['dev-target'].forEach(id=>$(id).addEventListener('change',buildDev));
$('dev-repo').addEventListener('input',buildDev);
$('dev-copy').onclick=()=>{const t=devBuilt.text||'';try{navigator.clipboard.writeText(t).then(()=>toast('개발 이슈 본문을 복사했습니다'),()=>fallbackCopy(t))}catch(e){fallbackCopy(t)}};


// 이슈 데이터가 바뀔 때마다 이슈 화면이 부릅니다
export function refresh(){renderAlerts();fillReportControls();buildReport();if(outState.cur==='dev')buildDev()}
export function onShow(){}

export { goReport, buildReport };
