// 시작점: 스타일 → 화면 조각 넣기(mount.js) → 화면 모듈 → 라우터 시작
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/trend.css';
import './styles/market.css';
import './styles/issues.css';
import './styles/report.css';
import './styles/a4.css';

import { VIEWS } from './mount.js';      // 반드시 화면 모듈보다 먼저
import { register, start } from './router.js';
import * as trend from './views/trend.js';
import './views/market-overview.js';
import * as market from './views/market.js';
import * as issues from './views/issues.js';
import * as report from './views/report.js';

const onShow = { issues: issues.onShow, trend: trend.onShow, market: market.onShow, report: report.onShow };
for (const [name, view, tab] of VIEWS) register(name, { view, tab, onShow: onShow[name] });

issues.render();
start();

// CSS가 적용되기 전의 깨진 첫 화면(스타일 없는 SVG 등)이 보이지 않도록 숨겨 둔 것을 푼다
document.getElementById('boot')?.remove();
