// 여러 화면이 같이 쓰는 작은 도우미
export const $ = id => document.getElementById(id);

export const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let tt;
export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('on'), 2600);
}

export function fallbackCopy(t) {
  const ta = document.createElement('textarea');
  ta.value = t; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  toast(ok ? '복사했습니다' : '복사가 막혀 있습니다. 미리보기에서 직접 선택해 복사해 주세요');
}

export function copyText(t, okMsg) {
  try { navigator.clipboard.writeText(t).then(() => toast(okMsg), () => fallbackCopy(t)); }
  catch (e) { fallbackCopy(t); }
}
