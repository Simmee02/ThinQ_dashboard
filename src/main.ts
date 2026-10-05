// 시작점: 스타일 → 화면 조각 넣기(mount.js) → 화면 모듈 → 라우터 시작
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/trend.css';
import './styles/market.css';
import './styles/issues.css';
import './styles/report.css';
import './styles/a4.css';

import { VIEWS } from './mount';      // 반드시 화면 모듈보다 먼저
import { register, start } from './router';
import './views/trend';
import * as market from './views/market';
import * as compete from './views/compete';
import * as issues from './views/issues';
import * as report from './views/report';

const onShow = { issues: issues.onShow, voc: market.onShow, market: compete.onShow, report: report.onShow };
// 예전 주소(#trend)는 VoC 분석 화면으로 보냅니다
if (location.hash.startsWith('#trend')) { try { history.replaceState(null, '', '#voc'); } catch (e) {} }
for (const [name, view, tab] of VIEWS) register(name, { view, tab, onShow: onShow[name] });

issues.render();
start();

// CSS가 적용되기 전의 깨진 첫 화면(스타일 없는 SVG 등)이 보이지 않도록 숨겨 둔 것을 푼다
document.getElementById('boot')?.remove();
