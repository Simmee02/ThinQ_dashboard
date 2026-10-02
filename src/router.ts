// 해시 라우터: #issues  #trend  #market  #report
// 파라미터는 점(.) 뒤에 붙입니다: #issues.VOC-231 (상세 열기), #market.3 (시장 선택)
// (공유 링크에서는 영문·숫자·. _ ~ - 만 쓰는 짧은 해시만 전달되므로 / 대신 . 을 씁니다)
type Route = { view: string; tab: string; onShow?: (param?: string) => void };
const routes: Record<string, Route> = {};
let current: string | null = null;

export function register(name: string, { view, tab, onShow }: Route) {
  routes[name] = { view, tab, onShow };
}

export function parse(hash: string = location.hash) {
  const raw = decodeURIComponent(hash.replace(/^#/, ''));
  const i = raw.indexOf('.');
  const name = i < 0 ? raw : raw.slice(0, i);
  const param = i < 0 ? '' : raw.slice(i + 1);
  return routes[name] ? { name, param } : { name: 'issues', param: '' };
}

export function go(name: string, param: string = '') {
  const target = '#' + name + (param ? '.' + param : '');
  if (location.hash === target) apply();
  else location.hash = target;          // hashchange → apply()
}

// 현재 화면 안에서 파라미터만 바꿀 때 (뒤로가기 기록을 남기지 않음)
export function setParam(param: string = '') {
  const { name } = parse();
  const target = '#' + name + (param ? '.' + param : '');
  if (location.hash !== target) {
    try { history.replaceState(null, '', target); } catch (e) { /* 일부 보기 화면은 막을 수 있음 */ }
  }
}

export function currentRoute() { return parse().name; }

function apply() {
  const { name, param } = parse();
  const changed = name !== current;
  for (const [n, r] of Object.entries(routes)) {
    const on = n === name;
    document.getElementById(r.view)!.hidden = !on;
    const tab = document.getElementById(r.tab);
    if (tab) tab.setAttribute('aria-selected', String(on));
  }
  current = name;
  if (changed) window.scrollTo(0, 0);
  routes[name].onShow?.(param);
}

export function start() {
  // 주소의 #값과 같은 id를 가진 요소로 브라우저가 스크롤하지 않도록, 화면 섹션 id는 view-xx 로 둡니다
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', apply);
  document.querySelectorAll<HTMLElement>('[data-route]').forEach(b => b.addEventListener('click', () => go(b.dataset.route!)));
  if (!routes[parse().name] || !location.hash) {
    try { history.replaceState(null, '', '#issues'); } catch (e) {}
  }
  apply();
}
