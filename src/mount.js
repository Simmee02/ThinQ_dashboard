// 화면 HTML 조각을 문서에 넣습니다.
// main.js 에서 가장 먼저 import 되므로, 뒤에 오는 화면 모듈들이 불러와질 때 요소가 이미 있습니다.
import issuesHtml from './pages/issues.html?raw';
import trendHtml from './pages/trend.html?raw';
import marketHtml from './pages/market.html?raw';
import reportHtml from './pages/report.html?raw';

export const VIEWS = [
  // 주소(#)   섹션 id    사이드바 탭
  ['issues', 'view-is', 'tab-is'],
  ['trend',  'view-ov', 'tab-ov'],
  ['market', 'view-mk', 'tab-mk'],
  ['report', 'view-rp', 'tab-rp'],
];

document.getElementById('views').innerHTML = [issuesHtml, trendHtml, marketHtml, reportHtml].join('');
