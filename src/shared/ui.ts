import agentTipUrl from '../assets/agent-tip.png';
// 여러 화면이 같이 쓰는 작은 도우미
// 화면 조각의 요소는 입력창·버튼 등 종류가 다양해서 any로 둔다 (value, onclick 등을 바로 쓰기 위해)
export const $ = (id: string): any => document.getElementById(id);

export const esc = (v: unknown): string => String(v).replace(/[&<>"]/g, c => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]));

let tt: ReturnType<typeof setTimeout>;
export function toast(msg: string) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('on'), 2600);
}

export function fallbackCopy(t: string) {
  const ta = document.createElement('textarea');
  ta.value = t; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  toast(ok ? '복사했습니다' : '복사가 막혀 있습니다. 미리보기에서 직접 선택해 복사해 주세요');
}

export function copyText(t: string, okMsg: string) {
  try { navigator.clipboard.writeText(t).then(() => toast(okMsg), () => fallbackCopy(t)); }
  catch (e) { fallbackCopy(t); }
}

// 에이전트의 팁 앞에 붙는 아이콘 (src/assets/agent-tip.png)
export const AGENT_ICON = `<img class="tip-ic" src="${agentTipUrl}" alt="" aria-hidden="true">`;
