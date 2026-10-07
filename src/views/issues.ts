// 이슈보드(#issues): KPI, 칸반 보드 / 목록 / 타임라인, 상세 Drawer(세부 내용·처리·분석·메일)
import { TODAY, ME, DEPTS, ST, EV, I, need, deptName, md, prio, fixDate, LOCALE, scr } from '../data/issues';
import type { Issue, IssueEvent, Status } from '../data/issues';
import { V } from '../data/markets';
import { $, esc, toast, AGENT_ICON } from '../shared/ui';
import { go, setParam } from '../router';
import { refresh as refreshReport, goReport, buildReport } from './report';

type ViewMode = 'board' | 'list' | 'timeline';
const state: { dept: string; f: string; q: string | null; sel: string | null; view: ViewMode; adding: string | null; menu: string | null } = { dept: 'all', f: 'need', q: null, sel: null, view: 'board', adding: null, menu: null };

// 보드 열: 신규 열에는 신규·재발이 함께 들어가고, 재발은 카드에 '재발' 칩으로 표시합니다
const LANES: { id: string; name: string; st: Status[]; color: string }[] = [
  { id: 'new', name: '신규', st: ['new', 'reopen'], color: 'var(--crit)' },
  { id: 'open', name: '진행 중', st: ['open'], color: 'var(--s1)' },
  { id: 'watch', name: '관찰', st: ['watch'], color: 'var(--ink-3)' },
  { id: 'done', name: '해결됨', st: ['done'], color: 'var(--good)' },
];
const laneOf = (it: Issue) => LANES.find(l => l.st.includes(it.status))!;
const orphan = (it: Issue) => need(it) && (it.dept === 'l10n' || !it.owner);
const vName = (it: Issue) => (V.find(v => v.id === it.verdict) || V[3]).name;
const vChip = (it: Issue) => `<span class="vd v-${it.verdict}">${vName(it)}</span>`;
const langText = (it: Issue) => !it.langs.length ? '—' : it.langs.length > 2 ? it.langs.slice(0, 2).join(', ') + ' 외 ' + (it.langs.length - 2) : it.langs.join(', ');
const noOf = (id: string) => 'No.' + id.replace(/^VOC-/, '');

function visible() {
  return I.filter(it => {
    if (state.dept !== 'all' && it.dept !== state.dept) return false;
    if (state.q === 'reopen') return it.status === 'reopen';
    if (state.q === 'new') return it.status === 'new';
    if (state.q === 'orphan') return orphan(it);
    return true;
  });
}
const byPrio = (a: Issue, b: Issue) => need(a) && need(b) ? prio(b).score - prio(a).score : fixDate(b).localeCompare(fixDate(a));

const BULB = AGENT_ICON;
const stPill = (s: Status) => `<span class="st ${s}"><i></i>${ST[s].t}</span>`;

function renderTop() {
  const live = I.filter(need);
  $('v-need').textContent = live.length;
  $('v-reopen').textContent = live.filter(i => i.status === 'reopen').length;
  $('v-new').textContent = live.filter(i => i.status === 'new').length;
  $('v-orphan').textContent = live.filter(orphan).length;
  const hot = live.filter(i => i.status === 'reopen' || i.status === 'new').length;
  $('bell-n').textContent = hot; $('bell-n').hidden = !hot;
  document.querySelectorAll<HTMLElement>('#view-is .stat').forEach(b => b.setAttribute('aria-pressed', !!state.q && state.q === b.dataset.q));
  $('dept-sel').innerHTML = [{ id: 'all', name: '전체 부서' }, ...DEPTS].map(d => `<option value="${d.id}" ${state.dept === d.id ? 'selected' : ''}>${d.name}</option>`).join('');
  document.querySelectorAll<HTMLElement>('#view-is .vt button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.view));
  const qn = ({ reopen: '재발 이슈', new: '신규 이슈', orphan: '담당자 미배정' } as Record<string, string>)[state.q || ''];
  $('bd-sub').textContent = qn || state.dept !== 'all'
    ? [qn, state.dept !== 'all' ? deptName(state.dept) : ''].filter(Boolean).join(' · ') + `만 보는 중 · ${visible().length}건`
    : '이슈 처리 현황을 확인하고, 관리해보세요.';
}

const drawerOpen = () => !$('drawer').hidden;
function openDrawer(id: string) { setParam(id); state.sel = id; state.menu = null; const oi = I.find(i => i.id === id); if (oi) { oi.editing = false; oi.pendingDone = false; oi.err = ''; oi.pick = null } $('drawer').hidden = false; $('scrim').hidden = false; renderList(); $('drawer').scrollTop = 0; $('dr-close').focus() }
function closeDrawer() { setParam(''); const last = state.sel; $('drawer').hidden = true; $('scrim').hidden = true; state.sel = null; renderList(); const r = last && document.querySelector<HTMLElement>(`#view-is [data-id="${last}"]`); if (r) r.focus() }

// ---------- 보드 ----------
const MORE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>';
function cardHTML(it: Issue) {
  const sel = drawerOpen() && it.id === state.sel;
  return `<article class="kc" data-id="${it.id}" tabindex="0" aria-current="${sel}">
    <div class="kc-top"><span class="no">${noOf(it.id)}</span><button class="more" data-more="${it.id}" aria-label="${noOf(it.id)} 메뉴" aria-expanded="${state.menu === it.id}">${MORE}</button>
      ${state.menu === it.id ? `<div class="kc-menu" role="menu"><button role="menuitem" data-act="open">상세 보기</button><button role="menuitem" data-act="report">보고서 만들기</button></div>` : ''}</div>
    <div class="chips">${vChip(it)}${it.status === 'reopen' ? '<span class="re">재발</span>' : ''}</div>
    <h3>${esc(it.title)}</h3>
    <div class="meta"><b>${deptName(it.dept)}</b><span>${esc(langText(it))}</span></div>
    <div class="kc-foot">${it.owner ? `<span class="av">${esc(it.owner[0])}</span><span class="own">${esc(it.owner)}</span>` : '<span class="av nob"></span><span class="own none">미지정</span>'}<span class="cd">${md(it.first)} 생성됨</span></div>
  </article>`;
}
function renderBoard() {
  const v = visible();
  $('kb').innerHTML = LANES.map(l => {
    const cards = v.filter(it => l.st.includes(it.status)).sort(byPrio);
    const add = l.id === 'done' ? '' : state.adding === l.id
      ? `<form class="kc-add" data-lane="${l.id}"><input name="t" placeholder="이슈 제목" aria-label="새 이슈 제목" autocomplete="off" required><div><button type="button" class="btn" data-cancel>취소</button><button class="btn primary">추가</button></div></form>`
      : `<button class="add" data-add="${l.id}">+ 이슈 추가하기</button>`;
    return `<div class="lane lane-${l.id}">
      <div class="ln-h"><i style="background:${l.color}"></i><b>${l.name}</b><span class="cnt">${cards.length}</span></div>
      <div class="ln-b">${cards.map(cardHTML).join('')}${add}</div>
    </div>`;
  }).join('');
  const kb: HTMLElement = $('kb');
  kb.querySelectorAll('.kc').forEach((c: HTMLElement) => {
    c.onclick = e => { if ((e.target as HTMLElement).closest('.more,.kc-menu')) return; openDrawer(c.dataset.id!) };
    c.onkeydown = e => { if (e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDrawer(c.dataset.id!) } };
  });
  kb.querySelectorAll('[data-more]').forEach((b: HTMLElement) => b.onclick = () => { state.menu = state.menu === b.dataset.more ? null : b.dataset.more!; renderBoard(); const m = kb.querySelector<HTMLElement>('.kc-menu button'); if (m) m.focus() });
  kb.querySelectorAll('.kc-menu [data-act]').forEach((b: HTMLElement) => b.onclick = () => {
    const id = b.closest<HTMLElement>('.kc')!.dataset.id!; state.menu = null;
    if (b.dataset.act === 'open') openDrawer(id); else goReport(id, 'a4');
  });
  kb.querySelectorAll('[data-add]').forEach((b: HTMLElement) => b.onclick = () => { state.adding = b.dataset.add!; renderBoard(); kb.querySelector<HTMLInputElement>('.kc-add input')!.focus() });
  const f = kb.querySelector<HTMLFormElement>('.kc-add');
  if (f) {
    f.querySelector<HTMLElement>('[data-cancel]')!.onclick = () => { state.adding = null; renderBoard() };
    f.onkeydown = e => { if (e.key === 'Escape') { state.adding = null; renderBoard() } };
    f.onsubmit = e => { e.preventDefault(); const t = (f.elements.namedItem('t') as HTMLInputElement).value.trim(); if (!t) return; addIssue(t, LANES.find(l => l.id === f.dataset.lane)!.st[0]) };
  }
}
// 직접 추가한 이슈: 에이전트가 찾은 리뷰가 아직 없으므로 판정 보류로 시작합니다
let seq = 300;
function addIssue(title: string, status: Status) {
  const id = 'VOC-' + (++seq);
  I.push({ id, verdict: 'none', title, dept: state.dept === 'all' ? 'thinq' : state.dept, area: '직접 등록', status, langs: [], topic: '직접 등록',
    shape: [[TODAY, 0]], events: [[TODAY, 'detect', `${ME}이(가) 직접 등록`]], why: '담당자가 직접 등록한 이슈입니다. 관련 리뷰가 모이면 에이전트가 판정을 붙입니다.', reviews: [],
    series: [{ d: TODAY, v: 0 }], total: 0, first: TODAY, trend: null, log: [[ME, '이슈 직접 등록', TODAY]] });
  state.adding = null; toast(`${noOf(id)} 이슈를 추가했습니다`); render();
}

// VoC 분석의 '확인할 과제'에서 승인한 이슈를 신규 열에 올립니다
export function addFromVoc(o: { title: string; verdict: Issue['verdict']; langs: string[]; topic: string; why: string }) {
  const id = 'VOC-' + (++seq);
  I.push({ id, verdict: o.verdict, title: o.title, dept: 'thinq', area: 'VoC 분석', status: 'new', langs: o.langs, topic: o.topic,
    shape: [[TODAY, 0]], events: [[TODAY, 'detect', 'VoC 분석에서 이슈 승인', ME]], why: o.why, reviews: [],
    series: [{ d: TODAY, v: 0 }], total: 0, first: TODAY, trend: null, log: [[ME, 'VoC 분석에서 이슈 승인', TODAY]] });
  render();
  return noOf(id);
}

// ---------- 목록 ----------
function renderTable() {
  const v = visible().sort((a, b) => LANES.indexOf(laneOf(a)) - LANES.indexOf(laneOf(b)) || byPrio(a, b)), box = $('issue-rows');
  if (!v.length) { box.innerHTML = '<tr><td colspan="8" class="empty" style="cursor:default">조건에 맞는 이슈가 없습니다.</td></tr>'; return }
  box.innerHTML = v.map((it, k) => `<tr data-id="${it.id}" tabindex="0" aria-selected="${drawerOpen() && it.id === state.sel}">
      <td class="rk">${k + 1}</td>
      <td><span class="tt">${esc(it.title)}</span><span class="tid">${noOf(it.id)} · ${esc(it.topic)}</span></td>
      <td>${vChip(it)}</td>
      <td>${deptName(it.dept)}</td>
      <td>${it.status === 'done' ? '<span class="st done"><i></i>해결됨</span>' : stPill(it.status)}</td>
      <td>${esc(langText(it))}</td>
      <td>${it.owner ? `<span class="${it.owner === ME ? 'own-me' : 'own'}">${esc(it.owner)}</span>` : '<span class="nobody">미지정</span>'}</td>
      <td>${md(it.first)}</td>
    </tr>`).join('');
  box.querySelectorAll('tr[data-id]').forEach((r: HTMLElement) => { r.onclick = () => openDrawer(r.dataset.id!); r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(r.dataset.id!) } } });
}

// ---------- 타임라인: 9월 한 달 동안 이슈별 진행 기간과 처리 이벤트 ----------
function renderTimeline() {
  const from = Date.parse('2026-09-01'), to = Date.parse(TODAY), span = to - from + 864e5;
  const pos = (d: string) => Math.max(0, Math.min(100, (Date.parse(d) - from) / span * 100));
  // 막대: 감지(첫 이벤트) ~ 해결 처리일(해결됨) 또는 오늘(진행 중인 이슈)
  const spanOf = (it: Issue): [string, string] => { const a = it.first! < '2026-09-01' ? '2026-09-01' : it.first!; return [a, it.status === 'done' ? (fixDate(it) || a) : TODAY] };
  const v = visible().filter(it => spanOf(it)[1] >= '2026-09-01')
    .sort((a, b) => LANES.indexOf(laneOf(a)) - LANES.indexOf(laneOf(b)) || byPrio(a, b));
  const ticks = ['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29'];
  $('tl-wrap').innerHTML = !v.length ? '<div class="empty">조건에 맞는 이슈가 없습니다.</div>' : `
    <div class="tl-row tl-axis"><span></span><div class="tl-track">${ticks.map(d => `<span style="left:${pos(d)}%">${md(d)}</span>`).join('')}</div></div>
    ${v.map(it => {
      const [a, b] = spanOf(it);
      const evs = it.events.filter(e => e[0] >= '2026-09-01' && e[1] !== 'hypo' && e[1] !== 'mail');
      return `<div class="tl-row" data-id="${it.id}" tabindex="0" role="button" aria-label="${esc(it.title)} 상세 보기">
        <span class="tl-name"><b>${esc(it.title)}</b><small>${noOf(it.id)} · ${laneOf(it).name}</small></span>
        <div class="tl-track"><span class="tl-bar lane-${laneOf(it).id}" style="left:${pos(a)}%;width:${Math.max(1.2, pos(b) - pos(a) + 100 / 30)}%"></span>
          ${evs.map(e => `<i class="tl-ev" style="left:${pos(e[0])}%;background:${EV[e[1]].c}" title="${e[0]} ${EV[e[1]].t}"></i>`).join('')}</div>
      </div>`;
    }).join('')}
    <div class="legend"><span><i style="background:var(--warn)"></i>감지</span><span><i style="background:var(--good)"></i>해결 처리</span><span><i style="background:var(--crit)"></i>재발</span></div>`;
  $('tl-wrap').querySelectorAll('[data-id]').forEach((r: HTMLElement) => { r.onclick = () => openDrawer(r.dataset.id!); r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(r.dataset.id!) } } });
}

function renderList() {
  $('kb').hidden = state.view !== 'board'; $('list-wrap').hidden = state.view !== 'list'; $('tl-wrap').hidden = state.view !== 'timeline';
  if (state.view === 'board') renderBoard(); else if (state.view === 'list') renderTable(); else renderTimeline();
  if (drawerOpen()) { if (I.find(i => i.id === state.sel)) renderDetail(); else closeDrawer() }
}

function chart(it,s){
  const n=s.length,Wd=600,H=196,L=4,R=4,T=18,B=24,pw=Wd-L-R,ph=H-T-B;
  const mx=Math.max(...s.map(p=>p.v),1),top=mx*1.04;
  const y=v=>T+ph-v/top*ph,slot=pw/n,x=i=>L+slot*i+slot/2,bw=Math.max(2,Math.min(12,slot*.6));
  let g='';
  s.forEach((p,i)=>{const h=y(0)-y(p.v),r=Math.min(2,bw/2,h);
    g+=`<path data-i="${i}" d="M${x(i)-bw/2},${y(0)} V${y(p.v)+r} Q${x(i)-bw/2},${y(p.v)} ${x(i)-bw/2+r},${y(p.v)} H${x(i)+bw/2-r} Q${x(i)+bw/2},${y(p.v)} ${x(i)+bw/2},${y(p.v)+r} V${y(0)} Z" fill="var(--bar-hi)" opacity=".55"/>`});
  const evIdx: Record<number, IssueEvent[]>={};it.events.forEach(e=>{const i=s.findIndex(p=>p.d===e[0]);if(i>=0)(evIdx[i]=evIdx[i]||[]).push(e)});
  Object.entries(evIdx).forEach(([i,es])=>{const e=es.find(z=>z[1]!=='mail'&&z[1]!=='hypo');if(!e)return;const c=EV[e[1]].c;
    g+=`<line x1="${x(i)}" x2="${x(i)}" y1="${T-6}" y2="${y(0)}" stroke="${c}" stroke-width="1.25"/><circle cx="${x(i)}" cy="${T-8}" r="4" fill="${c}"/>`});
  g+=`<line x1="${L}" x2="${Wd-R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)"/>`;
  const every=Math.ceil(n/6);
  s.forEach((p,i)=>{if(i%every===0)g+=`<text x="${x(i)}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${md(p.d)}</text>`});
  g+=`<rect id="hit" x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/>`;
  return {svg:`<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="일별 관련 리뷰 수">${g}</svg>`,geom:{L,slot,Wd,y,n}};
}

// 관련 리뷰 추이 카드의 기간 선택 (기본: 최근 30일)
function range(it){
  const a=it.series,first=a[0].d,last=a.at(-1).d;
  if(!it.rf||!it.rt){it.rf=a[Math.max(0,a.length-30)].d;it.rt=last}
  return {first,last,from:it.rf,to:it.rt,pts:a.filter(p=>p.d>=it.rf&&p.d<=it.rt)};
}

function renderDetail(){
  const it=I.find(i=>i.id===state.sel);if(!it)return;
  const rg=range(it),has=rg.pts.some(p=>p.v>0),c=chart(it,rg.pts),hot=it.status==='reopen'||it.real,p=it.status!=='done'?prio(it):null;
  const lastD=[...it.series].reverse().find(p=>p.v>0);
  $('detail').innerHTML=`
    <section class="card d-head">
      <div class="row">
        <div class="ttl"><div class="id">${it.id} · ${it.topic}</div><h2>${it.title}</h2></div>
        <div class="actions">
          <button class="btn" id="b-report">리포트</button>
          ${it.status==='done'?'<button class="btn" id="b-reopen">다시 열기</button>':it.status==='new'||it.status==='reopen'?'<button class="btn primary" id="b-start">처리 진행</button>':'<button class="btn primary" id="b-fix">처리 완료</button>'}
        </div>
      </div>
      <div class="tags">${it.status!=='done'?stPill(it.status):'<span class="st done"><i></i>해결</span>'}${vChip(it)}<span class="tag">${esc(it.area)}</span>${it.dept==='l10n'?'<span class="tag owner-none">담당 없음</span>':''}</div>
      ${p?'':`<div class="score"><span class="pr arch">해결됨</span><span>처리 완료 ${fixDate(it)||'—'} · 참고용으로 보관 중. 관련 리뷰가 다시 늘면 재발로 올라옵니다.</span></div>`}
      <div class="why agent-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> ${it.why}</span></div>
      <div class="kv">
        <div><span>최초 발생</span><b>${it.first}</b></div>
        <div><span>마지막 발생</span><b>${lastD?lastD.d:'—'}</b></div>
        <div><span>관련 리뷰</span><b>${it.total.toLocaleString('ko-KR')}건</b></div>
        <div><span>영향 언어권</span><b class="lg">${it.langs.join(', ')}</b></div>
      </div>
    </section>
    ${shotHTML(it)}
    ${opsHTML(it)}
    <section class="card">
      <h2>이슈 처리 이력</h2>
      <ol class="tl2">${it.events.map(e=>`<li class="${e[1]==='hypo'?'hypo':''}"><span class="when">${e[0]}</span><span class="mk" style="background:${EV[e[1]].c}"></span><span class="tx">${e[2]}${e[3]?`<small>${e[3]}</small>`:''}</span></li>`).join('')}</ol>
    </section>
    <section class="card">
      <h2>관련 리뷰 추이</h2>
      <div class="rng">
        <input type="date" id="rg-f" value="${rg.from}" min="${rg.first}" max="${rg.last}" aria-label="시작일"><span>~</span><input type="date" id="rg-t" value="${rg.to}" min="${rg.first}" max="${rg.last}" aria-label="종료일">
      </div>
      <div class="why agent-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> 감지·해결·재발 시점의 리뷰 변화를 비교해 이슈 처리 효과를 확인해 보세요.</span></div>
      ${has?`<div class="chart-box" id="cbox">${c.svg}<div class="tip" id="tip"></div></div>
      <div class="legend"><span><i style="background:var(--warn)"></i>감지</span><span><i style="background:var(--good)"></i>해결 처리</span><span><i style="background:var(--crit)"></i>재발</span><span><i style="background:var(--ink-3)"></i>보도</span></div>`:'<div class="empty-note">선택한 기간에 관련 리뷰가 없습니다.</div>'}
    </section>
    <section class="card">
      <h2>대표 리뷰</h2>
      <div class="rvs">${it.reviews.map(r=>`<div class="rv2"><span class="m">${r[0]} ${'★'.repeat(r[1])}</span><p>${r[2]}</p></div>`).join('')}</div>
    </section>
    ${mailHTML(it)}
    <div class="next"><div><b>보고서/개발 이슈 생성하기</b><span>해당 이슈의 A4 보고서와 GitHub 이슈 초안을 생성합니다.</span></div><button class="btn" id="b-next">리포트 탭으로 →</button></div>`;
  const setRg=(f,t)=>{if(f>t)[f,t]=[t,f];it.rf=f;it.rt=t;renderDetail()};
  $('rg-f').onchange=e=>{if(e.target.value)setRg(e.target.value,$('rg-t').value)};
  $('rg-t').onchange=e=>{if(e.target.value)setRg($('rg-f').value,e.target.value)};
  if(has){
  const svg=$('cbox').querySelector('svg'),tip=$('tip'),g=c.geom;
  $('cbox').querySelector('#hit').addEventListener('mousemove',ev=>{
    const r=svg.getBoundingClientRect(),sc=r.width/g.Wd,px=(ev.clientX-r.left)/sc;
    const i=Math.max(0,Math.min(g.n-1,Math.floor((px-g.L)/g.slot))),q=rg.pts[i];
    svg.querySelectorAll('path[data-i]').forEach(b=>b.setAttribute('opacity',+b.dataset.i===i?1:.55));
    const evs=it.events.filter(e=>e[0]===q.d&&e[1]!=='hypo').map(e=>EV[e[1]].t);
    tip.innerHTML=`${q.d} · <b>${q.v}</b>건${evs.length?' · '+evs.join(', '):''}`;
    tip.style.left=Math.min(Math.max((g.L+g.slot*i+g.slot/2)*sc,80),r.width-80)+'px';tip.style.top=(g.y(q.v)*sc-6)+'px';tip.style.opacity=1;
  });
  $('cbox').querySelector('#hit').addEventListener('mouseleave',()=>{tip.style.opacity=0;svg.querySelectorAll('path[data-i]').forEach(b=>b.setAttribute('opacity',.55))});
  }
  $('m-toggle').onclick=()=>{it.mailClosed=!it.mailClosed;renderDetail();$('m-toggle').focus()};
  $('b-report').onclick=()=>goReport(it.id,'a4');
  bindOps(it);bindShot(it);
  $('b-next').onclick=()=>goReport(it.id,'dev');
  if($('b-fix'))$('b-fix').onclick=()=>{
    if(it.owner&&it.memo){markDone(it);render();return}
    it.editing=true;it.pendingDone=true;
    if(!it.owner){it.pick='own';it.err='처리 완료하려면 먼저 대응 담당자를 지정해 주세요.'}
    else it.err='무엇을 했는지 메모를 남기고 저장해 주세요. 재발 판단의 기준이 됩니다.';
    renderDetail();const f=$(it.owner?'o-memo':'pk-q');f.scrollIntoView({block:'center'});f.focus();
  };
  // 신규·재발 이슈는 먼저 '처리 진행'으로 진행 중 열에 옮기고, 진행 중부터 '처리 완료'를 누를 수 있습니다
  if($('b-start'))$('b-start').onclick=()=>{
    it.prev=it.status;it.status='open';
    it.events.push([TODAY,'mail','담당자 확인 · 진행 중으로 변경','']);
    it.editedAt=fmtDate(new Date());it.editedBy=ME;(it.log=it.log||[]).push([ME,'처리 진행 · 진행 중으로 변경',nowStr()]);
    toast(`${it.id} 처리를 시작했습니다 · 진행 중으로 옮겼습니다`);render();
  };
  if($('b-reopen'))$('b-reopen').onclick=()=>{it.status=it.prev&&it.prev!=='done'?it.prev:'open';toast(`${it.id} 다시 열었습니다`);render()};
}
function markDone(it){
  it.prev=it.status;it.status='done';it.pendingDone=false;it.editing=false;it.err='';
  it.events.push([TODAY,'fix','담당자 해결 처리 완료',it.memo]);
  it.why='처리 완료했습니다. 관련 리뷰가 다시 늘면 에이전트가 재발로 올립니다.';
  it.editedAt=fmtDate(new Date());it.editedBy=ME;it.log.push([ME,'처리 완료 · '+it.memo,nowStr()]);
  toast(`${it.id} 처리 완료 · 해결됨으로 옮겼습니다`);
}
function mailHTML(it){
  const bar=`<div class="mail-bar${it.status==='new'?' new':''}"><span>에이전트가 보내는 알림 메일 미리보기</span><button class="btn" id="m-toggle" aria-expanded="${!it.mailClosed}">${it.mailClosed?'펼치기':'닫기'}</button></div>`;
  if(it.mailClosed)return `<section class="mail" aria-label="알림 메일 미리보기">${bar}</section>`;
  const orphan=it.dept==='l10n';
  const to=orphan?'번역부 · 서비스 기획팀 (전담 조직 없음)':deptName(it.dept);
  const st={reopen:'[재발]',new:'[신규]',open:'[진행]',watch:'[관찰]',done:'[해결]'}[it.status];
  const kind=orphan?'[현지화]':it.area==='제품(하드웨어)'?'[제품]':'[오류]';
  const f=it.first,ls=it.langs.length>2?`${it.langs.slice(0,2).join(', ')} 외 ${it.langs.length-2}개 언어권`:it.langs.join(', ');
  const body=it.mailBody||`${f.slice(5,7)}.${f.slice(8,10)} 이후 ${ls}에서 "${it.topic}" 관련 불만이 반복적으로 보고되었습니다.`;
  return `<section class="mail" aria-label="알림 메일 미리보기">${bar}
    <div class="mail-body">
      <div class="f"><span>받는 곳</span><b>${to}</b></div>
      <div class="f"><span>제목</span><b>${st}${kind} ${it.title} (${it.id})</b></div>
      <p>${body}</p>
    </div></section>`;
}

// ---------- 처리 패널: 에이전트 재검토 + 사람의 검토·배정·대응 기록 ----------
const nowStr=()=>{const d=new Date();return `${TODAY.slice(5).replace('-','/')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const fmtDate=d=>`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
const PEOPLE=[
  {d:'THINQ 개발부',n:'김재민',t:'선임'},{d:'THINQ 개발부',n:'심지영',t:'책임'},{d:'THINQ 개발부',n:'정하린',t:'선임'},{d:'THINQ 개발부',n:'이도윤',t:'연구원'},
  {d:'에어컨 개발부',n:'박홍지',t:'책임'},{d:'에어컨 개발부',n:'최민석',t:'선임'},
  {d:'세탁기 개발부',n:'임단하',t:'선임'},{d:'세탁기 개발부',n:'오세진',t:'책임'},
  {d:'번역부',n:'윤서아',t:'번역 담당'},{d:'번역부',n:'한유나',t:'번역 담당'},
  {d:'서비스 기획팀',n:'강지후',t:'매니저'}
];
const person=n=>PEOPLE.find(p=>p.n===n);
const pLabel=n=>{const p=person(n);return p?`${p.d} · ${p.n} ${p.t}`:n};
const ROLE={rev:['reviewer','검토 담당자'],own:['owner','대응 담당자']};
function pickerHTML(it,role){
  const cur=it[ROLE[role][0]]||'',mine=deptName(it.dept);
  const order=[mine,...[...new Set(PEOPLE.map(p=>p.d))].filter(d=>d!==mine)];
  return `<div class="picker" id="pk-${role}" role="group" aria-label="${ROLE[role][1]} 고르기">
    <div class="pk-top"><input id="pk-q" type="search" placeholder="이름이나 부서로 찾기" aria-label="이름이나 부서로 찾기" autocomplete="off"></div>
    <div class="pk-list" id="pk-list">${order.map(d=>`<div class="pk-g" data-d="${d}"><div class="pk-h">${d}${d===mine?' <span class="tag">이 이슈 담당 부서</span>':''}</div>${PEOPLE.filter(p=>p.d===d).map(p=>`<button class="pk-i" data-n="${p.n}" data-k="${p.d} ${p.n} ${p.t}" aria-pressed="${p.n===cur}"><span class="av">${p.n[0]}</span><span><b>${p.n}</b> ${p.t}</span>${p.n===cur?'<span class="ck">지정됨</span>':''}</button>`).join('')}</div>`).join('')}
      <div class="pk-empty" id="pk-empty" hidden>찾는 사람이 없습니다. 이름이나 부서를 다시 확인해 주세요.</div></div>
    <div class="pk-foot"><span>고르면 바로 지정됩니다</span>${cur?'<button class="btn" id="pk-clear">지정 해제</button>':''}<button class="btn" id="pk-close">닫기</button></div>
  </div>`;
}
function assignPerson(it,role,n){
  const [key,rl]=ROLE[role],prev=it[key]||'';it[key]=n;it.pick=null;
  if(n!==prev){it.editedAt=fmtDate(new Date());it.editedBy=ME;it.log.push([ME,n?`${rl} ${pLabel(n)}`:`${rl} 지정 해제`,nowStr()]);toast(n?`${rl}를 ${pLabel(n)}(으)로 지정했습니다`:`${rl} 지정을 해제했습니다`)}
  if(it.pendingDone)it.err=!it.owner?'처리 완료하려면 먼저 대응 담당자를 지정해 주세요.':!it.memo?'무엇을 했는지 메모를 남기고 저장해 주세요. 재발 판단의 기준이 됩니다.':'';
  render();
  const b=document.querySelector<HTMLElement>(`#detail [data-pick="${role}"]`);if(b)b.focus();
}
const PENCIL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
function opsHTML(it){
  it.log=it.log||[['에이전트','부서 자동 분류: '+deptName(it.dept)]];
  const ed=!!it.editing,dis=ed?'':' disabled',rv=it.rev;
  return `<section class="card ops" aria-label="처리">
    <div class="ops-h"><h2>처리 <span class="sub">이슈의 담당자와 현황</span></h2>
      <button class="ic-btn" id="o-edit" aria-pressed="${ed}" aria-label="${ed?'편집 취소':'처리 내용 편집'}" title="${ed?'편집 취소':'편집'}">${PENCIL}</button></div>
    <div class="ops-agent">
      <span class="agent-tip">${BULB}<span><b class="tip-k">에이전트의 팁 :</b> 관련 내용을 AI에게 다시 맡겨 재검토할 수 있습니다</span></span>
      <button class="btn" id="o-run">재검토 실행</button>
      ${rv?`<div class="ops-res">원문 <b>${rv.n}건</b>을 다시 읽음 · <b>${rv.m}건</b>이 "${esc(it.topic)}" 내용과 일치(${Math.round(rv.m/rv.n*100)}%) · 담당 부서 <b>${esc(deptName(it.dept))}</b> 유지</div>`:''}
    </div>
    <div class="fld"><label for="o-dept">담당 부서</label>
      <div class="ctl"><select id="o-dept"${dis}>${DEPTS.map(d=>`<option value="${d.id}" ${d.id===it.dept?'selected':''}>${d.name}</option>`).join('')}</select></div></div>
    <div class="fld"><label for="o-rev">검토 담당자</label>
      <div class="ctl"><input id="o-rev" readonly placeholder="검토 담당자를 설정해주세요" value="${it.reviewer?esc(pLabel(it.reviewer)):''}"><button class="btn" data-pick="rev" aria-expanded="${it.pick==='rev'}" aria-controls="pk-rev">담당자 변경</button></div>
      ${it.pick==='rev'?pickerHTML(it,'rev'):''}</div>
    <div class="fld"><label for="o-own">대응 담당자</label>
      <div class="ctl"><input id="o-own" readonly placeholder="대응 담당자를 설정해주세요" value="${it.owner?esc(pLabel(it.owner)):''}"><button class="btn" data-pick="own" aria-expanded="${it.pick==='own'}" aria-controls="pk-own">담당자 변경</button></div>
      ${it.pick==='own'?pickerHTML(it,'own'):''}</div>
    <div class="fld"><label for="o-sit">현황</label>
      <div class="ctl"><input id="o-sit" placeholder="현재 상황을 한 줄로 적어 주세요" value="${esc(it.situation||'')}"${dis}></div></div>
    <div class="fld"><label for="o-memo">메모</label>
      <div class="ctl"><input id="o-memo" placeholder="메모를 입력해 주세요." value="${esc(it.memo||'')}"${dis}></div></div>
    ${it.err?`<span class="err" role="alert">${esc(it.err)}</span>`:''}
    <div class="ops-foot">${ed?'<button class="btn" id="o-cancel">취소</button><button class="btn primary" id="o-save">'+(it.pendingDone?'저장하고 처리 완료':'저장')+'</button>':`<span>${it.editedAt||'2026.09.30'}에 최종 편집됨${it.editedBy?' · '+esc(it.editedBy):''}</span>`}</div>
  </section>`;
}
function bindOps(it){
  $('o-run').onclick=()=>{const n=Math.min(it.total,60);it.rev={n,m:Math.round(n*(0.78+((it.id.charCodeAt(6)%7)/50)))};it.log.push(['에이전트','원문 재검토 실행',nowStr()]);renderDetail()};
  $('o-edit').onclick=()=>{it.editing=!it.editing;if(!it.editing){it.pendingDone=false;it.err=''}renderDetail();if(it.editing)$('o-dept').focus();else $('o-edit').focus()};
  const togglePick=role=>{it.pick=it.pick===role?null:role;renderDetail();if(it.pick)$('pk-q').focus();else{const b=document.querySelector<HTMLElement>(`#detail [data-pick="${role}"]`);if(b)b.focus()}};
  document.querySelectorAll<HTMLElement>('#detail [data-pick]').forEach(b=>b.onclick=()=>togglePick(b.dataset.pick));
  $('o-rev').onclick=()=>togglePick('rev');$('o-own').onclick=()=>togglePick('own');
  if(it.pick){
    const role=it.pick;
    $('pk-q').oninput=()=>{const q=$('pk-q').value.trim().toLowerCase();let any=false;
      document.querySelectorAll<HTMLElement>('#pk-list .pk-g').forEach(g=>{let n=0;g.querySelectorAll<HTMLElement>('.pk-i').forEach(b=>{const ok=!q||b.dataset.k.toLowerCase().includes(q);b.hidden=!ok;if(ok)n++});g.hidden=!n;if(n)any=true});
      $('pk-empty').hidden=any};
    $('pk-q').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const f=document.querySelector<HTMLElement>('#pk-list .pk-i:not([hidden])');if(f)f.focus()}};
    document.querySelectorAll<HTMLElement>('#pk-list .pk-i').forEach(b=>b.onclick=()=>assignPerson(it,role,b.dataset.n));
    $('pk-close').onclick=()=>togglePick(role);
    if($('pk-clear'))$('pk-clear').onclick=()=>assignPerson(it,role,'');
  }
  if(!it.editing)return;
  $('o-cancel').onclick=()=>{it.editing=false;it.pendingDone=false;it.err='';it.pick=null;renderDetail();$('o-edit').focus()};
  $('o-save').onclick=()=>{
    const dept=$('o-dept').value,sit=$('o-sit').value.trim(),memo=$('o-memo').value.trim();
    if(it.pendingDone&&(!it.owner||!memo)){
      it.situation=sit;it.memo=memo;
      if(!it.owner){it.err='처리 완료하려면 먼저 대응 담당자를 지정해 주세요.';it.pick='own';renderDetail();$('pk-q').focus()}
      else{it.err='무엇을 했는지 메모를 남겨 주세요. 재발 판단의 기준이 됩니다.';renderDetail();$('o-memo').focus()}
      return;
    }
    const ch=[];let deptMoved=false;
    if(dept!==it.dept){ch.push(`부서 ${deptName(it.dept)} → ${deptName(dept)}`);it.dept=dept;deptMoved=true}
    if(sit!==(it.situation||'')){ch.push('현황 수정');it.situation=sit}
    if(memo!==(it.memo||'')){ch.push('메모 수정');it.memo=memo}
    it.editing=false;it.err='';
    if(ch.length){it.editedAt=fmtDate(new Date());it.editedBy=ME;it.log.push([ME,ch.join(' · '),nowStr()])}
    if(it.pendingDone){markDone(it)}
    else toast(!ch.length?'바뀐 내용이 없습니다':deptMoved?'저장했습니다 · 부서 변경은 분류 학습 자료로 기록됩니다':'처리 내용을 저장했습니다');
    render();
  };
}

function shotHTML(it){
  const [screen,ok,reason]=scr(it),loc=it.langs.map(l=>LOCALE[l]).filter(Boolean);
  return `<section class="card shot" aria-label="세부 내용">
    <h2>세부 내용 <span class="sub">이슈에 대한 세부 내용</span></h2>
    <div class="dl">
      <div><span>화면</span><b>${esc(screen)}</b></div>
      <div><span>재현 조건</span><b>${loc.length?loc.join(' · ')+' · ':''}Android 14 에뮬레이터 · 앱 최신 버전</b></div>
      <div><span>판단</span><b>${esc(reason)}</b></div>
      <div><span>출처</span>${it.shot?`<b class="src"><img src="${it.shot}" alt="첨부한 사진">사진${it.shotName?' · '+esc(it.shotName):''}</b>`:'<b class="muted">참조한 문서가 있다면 여기에</b>'}</div>
    </div>
    ${it.repro?`<div class="shot-st">재현 요청됨 · ${it.repro} · 다음 에이전트 실행(10:00)에 처리 예정 <span style="color:var(--ink-3)">(목업)</span></div>`:''}
    <div class="shot-act">
      <button class="btn" id="shot-req">${it.repro?'재현 요청 취소':'재현 요청'}</button>
      <label class="btn" for="shot-file">사진 첨부</label><input type="file" id="shot-file" accept="image/*" hidden>
      ${it.shot?'<button class="btn" id="shot-del">사진 지우기</button>':''}
    </div>
  </section>`;
}
function bindShot(it){
  $('shot-req').onclick=()=>{
    if(it.repro){it.repro=null;it.log.push(['담당자','화면 재현 요청 취소',nowStr()]);toast('재현 요청을 취소했습니다')}
    else{it.repro=nowStr();it.log.push(['담당자',`화면 재현 요청: ${scr(it)[0]}`,it.repro]);toast('재현 요청을 에이전트 작업에 올렸습니다 (목업)')}
    renderDetail();
  };
  $('shot-file').onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
    if(!f.type.startsWith('image/')){toast('이미지 파일만 첨부할 수 있습니다');return}
    const rd=new FileReader();rd.onload=()=>{it.shot=rd.result;it.shotSrc='team';it.shotName=f.name;it.log.push(['담당자','사진 첨부: '+f.name,nowStr()]);toast('사진을 첨부했습니다 · 보고서와 개발 이슈에도 반영됩니다');renderDetail();buildReport()};rd.readAsDataURL(f)};
  if($('shot-del'))$('shot-del').onclick=()=>{it.shot=null;it.shotSrc=null;renderDetail();buildReport()};
}


// ---------- 이벤트 연결 ----------
document.querySelectorAll<HTMLElement>('#view-is .stat').forEach(b=>b.onclick=()=>{const q=b.dataset.q!;state.q=(q==='need'||state.q===q)?null:q;state.sel=null;render()});
document.querySelectorAll<HTMLElement>('#view-is .vt button').forEach(b=>b.onclick=()=>{state.view=b.dataset.v as ViewMode;state.menu=null;state.adding=null;render()});
$('dept-sel').onchange=()=>{state.dept=$('dept-sel').value;render()};
$('dr-close').onclick=closeDrawer;$('scrim').onclick=closeDrawer;
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(state.menu&&!drawerOpen()){const id=state.menu;state.menu=null;renderBoard();document.querySelector<HTMLElement>(`#kb [data-more="${id}"]`)?.focus();return}
  if(!drawerOpen())return;const it=I.find(i=>i.id===state.sel);if(it&&it.pick){const r=it.pick;it.pick=null;renderDetail();const b=document.querySelector<HTMLElement>(`#detail [data-pick="${r}"]`);if(b)b.focus();return}closeDrawer()});
document.addEventListener('click',e=>{if(state.menu&&!(e.target as HTMLElement).closest('.kc-menu,.more')){state.menu=null;renderBoard()}});
$('bell').onclick=()=>{state.q=null;render();go('report')};

export function render(){renderTop();renderList();refreshReport()}

// 라우터가 #issues 를 보여 줄 때 호출: #issues.VOC-231 이면 그 이슈 상세를 엽니다
export function onShow(param){
  const it=param&&I.find(i=>i.id===param);
  if(it){if(state.sel!==it.id||!drawerOpen()){renderTop();openDrawer(it.id)}}
  else if(drawerOpen())closeDrawer();
}

export { state, openDrawer, closeDrawer };
