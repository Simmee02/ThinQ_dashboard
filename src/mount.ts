// 화면 HTML 조각을 문서에 넣습니다.
// main.ts 에서 가장 먼저 import 되므로, 뒤에 오는 화면 모듈들이 불러와질 때 요소가 이미 있습니다.
import issuesHtml from './pages/issues.html?raw';
import trendHtml from './pages/trend.html?raw';
import marketHtml from './pages/market.html?raw';
import competeHtml from './pages/compete.html?raw';
import reportHtml from './pages/report.html?raw';

export const VIEWS: [string, string, string][] = [
  // 주소(#)   섹션 id    사이드바 탭
  ['issues', 'view-is', 'tab-is'],
  ['voc',    'view-mk', 'tab-mk'],
  ['market', 'view-cp', 'tab-cp'],
  ['report', 'view-rp', 'tab-rp'],
];

// VoC 분석 화면 안 '전체' 자리에 기존 글로벌 VoC 동향 조각을 넣습니다
document.getElementById('views')!.innerHTML = [issuesHtml, marketHtml.replace('<!--OVERVIEW-->', trendHtml), competeHtml, reportHtml].join('');
