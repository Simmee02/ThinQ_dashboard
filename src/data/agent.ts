// 에이전트 제안: 개선 목표 × 집중 이슈 → 먼저 확인할 사내 지표 + 개선 방향 후보
// 지금은 규칙 기반 예시 데이터입니다. 실제 서비스에서는 이 자리를 에이전트(LLM) 응답으로 바꿉니다.

export type Goal = 'retain' | 'onboard' | 'update';

export interface Metric { name: string; why: string; rule: string; src: string; goals: Goal[] }
export interface Solution { name: string; what: string; measure: string; goals: Goal[] }

export const GOALS: Record<Goal, { label: string; stage: string }> = {
  retain:  { label: '리텐션 올리기',          stage: '지속 사용' },
  onboard: { label: '연동 성공률 올리기',      stage: '연동·첫 사용' },
  update:  { label: '업데이트 후 이탈 줄이기',  stage: '지속 사용(업데이트 직후)' },
};

// 언어권 단위 시장: 리뷰만으로는 나라를 알 수 없음 → 국가를 확정하는 지표를 먼저 둔다
export const LANG_GROUP = ['영어권', '스페인어권', '중동(아랍어권)'];

// 목표별 공통 지표 (어떤 이슈든 이 목표라면 먼저 볼 것)
const BASE: Record<Goal, (topic: string) => Metric> = {
  retain: t => ({ name: `${t} 경험 여부별 30일 리텐션`, why: '이 이슈가 실제로 사용 중단으로 이어지는지 확인합니다. 리뷰만으로는 알 수 없는 부분입니다.', rule: '경험한 사용자가 뚜렷이 낮으면 현지화 니즈로 확정', src: '앱 사용 로그 + 기기 로그', goals: ['retain'] }),
  onboard: t => ({ name: `${t} 관련 첫 연동 성공률`, why: '처음 연결하는 단계에서 이 이슈로 막히는지 확인합니다.', rule: '다른 시장보다 낮으면 연동 단계 현지화 니즈로 확정', src: '기기 등록 로그', goals: ['onboard'] }),
  update: t => ({ name: `업데이트 후 7일 내 ${t} 오류율`, why: '업데이트 직후에 이 이슈가 늘어나는지 확인합니다.', rule: '직전 버전보다 높으면 업데이트가 원인 후보', src: '크래시·오류 로그', goals: ['update'] }),
};

const POOL: Record<string, { metrics: Metric[]; solutions: Solution[] }> = {
  '연결·기기 인식 실패': {
    metrics: [
      { name: '기기 검색 단계 실패율', why: '앱이 기기를 아예 찾지 못하는 경우가 실제로 많은지 봅니다.', rule: '다른 시장보다 높으면 검색·페어링 흐름 점검', src: '기기 등록 로그', goals: ['onboard', 'retain'] },
      { name: 'Wi-Fi 대역(2.4/5GHz)별 등록 실패율', why: '공유기 대역 설정 때문에 연결이 막히는지 확인합니다.', rule: '5GHz에 몰리면 대역 안내 부족', src: '기기 등록 로그', goals: ['onboard'] },
      { name: '기기 인식 실패 경험자의 30일 리텐션', why: '처음에 막힌 사용자가 다시 돌아오는지 봅니다.', rule: '경험자가 뚜렷이 낮으면 현지화 니즈로 확정', src: '앱 사용 로그', goals: ['retain'] },
      { name: '업데이트 후 기기 인식 실패율', why: '업데이트 뒤 기존 기기를 못 찾는 경우를 봅니다.', rule: '직전 버전보다 높으면 회귀 문제', src: '기기 등록 로그', goals: ['update'] },
    ],
    solutions: [
      { name: '등록 전 환경 점검', what: 'Wi-Fi 대역·위치 권한·블루투스를 등록 전에 먼저 확인해 줍니다.', measure: 'Wi-Fi 대역(2.4/5GHz)별 등록 실패율', goals: ['onboard'] },
      { name: '검색 실패 시 대체 등록 경로', what: 'QR·모델 번호 입력처럼 다른 등록 방법을 바로 제시합니다.', measure: '기기 검색 단계 실패율', goals: ['onboard', 'retain'] },
      { name: '업데이트 후 기기 인식 점검', what: '현지에서 많이 쓰는 기기로 업데이트 후 인식 여부를 먼저 테스트합니다.', measure: '업데이트 후 기기 인식 실패율', goals: ['update'] },
    ],
  },
  '업데이트 후 고장': {
    metrics: [
      { name: '앱 버전별 크래시율 (이 시장 vs 전체)', why: '특정 버전에서 이 시장에만 고장이 많은지 확인합니다.', rule: '같은 버전에서 이 시장만 높으면 현지 기기·환경 요인으로 좁힘', src: '크래시 리포트', goals: ['update', 'retain'] },
      { name: '업데이트 후 기기 목록 누락·재등록 건수', why: '"업데이트 후 기기가 사라졌다"는 리뷰 신호를 확인합니다.', rule: '업데이트 직후 급증하면 데이터 이전 문제', src: '기기 등록 로그', goals: ['update', 'onboard'] },
      { name: '업데이트 후 재로그인 요청 비율', why: '로그인 유지가 풀리는 문제가 반복되는지 봅니다.', rule: '버전마다 반복되면 인증 처리 점검', src: '계정·인증 로그', goals: ['update', 'retain'] },
    ],
    solutions: [
      { name: '단계적 배포와 시장별 크래시 감시', what: '일부 사용자에게 먼저 배포하고 이 시장에서 크래시가 늘면 멈춥니다.', measure: '앱 버전별 크래시율 (이 시장 vs 전체)', goals: ['update', 'retain'] },
      { name: '업데이트 전후 기기 목록·로그인 유지 점검', what: '업데이트 테스트에 현지에서 많이 쓰는 기기 구성을 포함합니다.', measure: '업데이트 후 기기 목록 누락·재등록 건수', goals: ['update', 'onboard'] },
    ],
  },
  '연결 끊김·재연동': {
    metrics: [
      { name: '끊김 후 24시간 내 자동 복구율', why: '사용자가 손대지 않아도 기기가 다시 연결되는지 봅니다.', rule: '다른 시장보다 낮으면 우선 개선 대상', src: '기기 연결 로그', goals: ['retain', 'update'] },
      { name: '기기 재등록 비율', why: '"지우고 다시 등록해야 연결된다"는 리뷰 신호가 실제로 많은지 확인합니다.', rule: '월별로 늘고 있으면 재연동 흐름 문제', src: '기기 등록 로그', goals: ['retain', 'onboard', 'update'] },
      { name: '공유기 재시작 후 재연결 실패율', why: '네트워크가 바뀐 뒤 다시 붙지 못하는 경우를 봅니다.', rule: '특정 공유기·통신사에 몰리면 환경 요인', src: '기기 연결 로그', goals: ['onboard', 'retain'] },
      { name: '업데이트 후 연결 정보 초기화 건수', why: '업데이트 뒤 기기가 목록에서 빠지거나 다시 연결해야 하는지 봅니다.', rule: '업데이트 직후 급증하면 데이터 이전 문제', src: '기기 등록 로그', goals: ['update'] },
    ],
    solutions: [
      { name: '공유기 재시작 후 자동 재연결', what: '전원이나 공유기가 다시 켜지면 재등록 없이 기기가 다시 연결되게 합니다.', measure: '끊김 후 24시간 내 자동 복구율', goals: ['retain', 'onboard'] },
      { name: '오프라인 원인 안내와 1탭 복구', what: '끊겼을 때 원인(공유기·전원·서버)과 복구 버튼을 바로 보여 줍니다.', measure: '기기 재등록 비율', goals: ['retain'] },
      { name: '업데이트 시 연결 정보 유지 점검', what: '업데이트 테스트에 기존 기기 연결 유지 여부를 포함합니다.', measure: '업데이트 후 연결 정보 초기화 건수', goals: ['update'] },
      { name: '연결 단계별 진단 가이드', what: '연결이 안 될 때 Wi-Fi 대역·계정·거리 등을 순서대로 확인해 줍니다.', measure: '공유기 재시작 후 재연결 실패율', goals: ['onboard'] },
    ],
  },
  '세탁기·건조기': {
    metrics: [
      { name: '세탁 완료 알림 도달률', why: '알림이 늦거나 오지 않는 문제가 실제로 많은지 봅니다.', rule: '다른 시장보다 낮으면 알림 경로 점검', src: '푸시 발송·수신 로그', goals: ['retain'] },
      { name: '원격 시작 실패율', why: '앱에서 세탁을 시작하려다 실패하는 비율을 봅니다.', rule: '특정 모델에 몰리면 모델 호환 문제', src: '기기 제어 로그', goals: ['retain', 'onboard'] },
      { name: '세탁기 첫 등록 성공률', why: '세탁기를 처음 연결하는 단계에서 막히는지 봅니다.', rule: '다른 제품군보다 낮으면 등록 흐름 개선', src: '기기 등록 로그', goals: ['onboard'] },
      { name: '업데이트 후 세탁기 제어 오류율', why: '업데이트 뒤 세탁기 제어가 깨지는지 봅니다.', rule: '직전 버전보다 높으면 회귀 문제', src: '크래시·오류 로그', goals: ['update'] },
    ],
    solutions: [
      { name: '알림 도달 보장', what: '알림이 실패하면 다시 보내거나 앱 안 알림으로 대신 알려 줍니다.', measure: '세탁 완료 알림 도달률', goals: ['retain'] },
      { name: '원격 시작 실패 원인 안내', what: '문 열림·원격 시작 설정 꺼짐 등 실패 이유를 바로 보여 줍니다.', measure: '원격 시작 실패율', goals: ['retain', 'onboard'] },
      { name: '모델별 등록 안내', what: '세탁기 모델마다 다른 등록 버튼 위치·순서를 화면에서 안내합니다.', measure: '세탁기 첫 등록 성공률', goals: ['onboard'] },
      { name: '업데이트 전 모델 호환 점검', what: '현지에서 많이 쓰는 세탁기 모델로 업데이트를 먼저 테스트합니다.', measure: '업데이트 후 세탁기 제어 오류율', goals: ['update'] },
    ],
  },
  '에어컨·냉장고 제어': {
    metrics: [
      { name: '제어 명령 응답 시간(중앙값)', why: '"앱에서 바꾸면 늦게 반영된다"는 리뷰 신호를 확인합니다.', rule: '다른 시장보다 길면 서버·네트워크 경로 점검', src: '기기 제어 로그', goals: ['retain'] },
      { name: '제어 명령 실패율', why: '명령이 아예 전달되지 않는 비율을 봅니다.', rule: '성수기에 급증하면 용량 문제', src: '기기 제어 로그', goals: ['retain', 'update'] },
      { name: '에어컨 첫 연동 성공률', why: '처음 연결하는 단계에서 막히는지 봅니다.', rule: '다른 제품군보다 낮으면 등록 흐름 개선', src: '기기 등록 로그', goals: ['onboard'] },
      { name: '업데이트 후 제어 응답 지연', why: '업데이트 뒤 응답이 느려졌는지 봅니다.', rule: '직전 버전보다 길면 성능 회귀', src: '기기 제어 로그', goals: ['update'] },
    ],
    solutions: [
      { name: '명령 처리 상태 표시', what: '전송 중·적용 완료를 화면에 보여 줘 반복 조작을 줄입니다.', measure: '제어 명령 응답 시간(중앙값)', goals: ['retain'] },
      { name: '성수기 전 서버 용량 점검', what: '여름·겨울 성수기 전에 제어 서버 용량을 미리 늘립니다.', measure: '제어 명령 실패율', goals: ['retain', 'update'] },
      { name: '등록 중 네트워크 진단', what: '에어컨 등록 단계에서 Wi-Fi 신호와 대역을 먼저 확인합니다.', measure: '에어컨 첫 연동 성공률', goals: ['onboard'] },
      { name: '업데이트 응답 성능 테스트', what: '배포 전에 제어 응답 시간을 이전 버전과 비교합니다.', measure: '업데이트 후 제어 응답 지연', goals: ['update'] },
    ],
  },
  'TV 제어·미러링': {
    metrics: [
      { name: '미러링 연결 실패율', why: '화면 미러링이 실패하는 비율을 봅니다.', rule: 'TV 모델별로 몰리면 호환 문제', src: 'TV 연결 로그', goals: ['retain', 'onboard'] },
      { name: 'TV 리모컨 기능 재사용률', why: '한 번 써 본 사용자가 다시 쓰는지 봅니다.', rule: '다른 시장보다 낮으면 사용 경험 문제', src: '앱 사용 로그', goals: ['retain'] },
      { name: 'TV 첫 연결 성공률', why: 'TV를 처음 연결하는 단계에서 막히는지 봅니다.', rule: '다른 시장보다 낮으면 연결 흐름 개선', src: 'TV 연결 로그', goals: ['onboard'] },
      { name: 'webOS 버전별 제어 오류율', why: 'TV 업데이트 뒤 제어가 깨지는지 봅니다.', rule: '특정 버전에 몰리면 호환성 문제', src: 'TV 연결 로그', goals: ['update'] },
    ],
    solutions: [
      { name: '미러링 실패 단계별 안내', what: '같은 Wi-Fi·TV 설정 등 실패 원인을 순서대로 확인해 줍니다.', measure: '미러링 연결 실패율', goals: ['onboard', 'retain'] },
      { name: '리모컨 응답 개선', what: '자주 쓰는 버튼의 응답 시간을 줄이고 입력 피드백을 보여 줍니다.', measure: 'TV 리모컨 기능 재사용률', goals: ['retain'] },
      { name: 'webOS 업데이트 전 호환 테스트', what: 'TV 펌웨어 배포 전에 앱 제어 기능을 함께 테스트합니다.', measure: 'webOS 버전별 제어 오류율', goals: ['update'] },
    ],
  },
  'TV-앱 연동·펌웨어': {
    metrics: [
      { name: 'TV 모델·webOS 버전별 연동 실패율', why: '특정 모델이나 펌웨어에서만 실패하는지 봅니다.', rule: '특정 버전에 몰리면 펌웨어 호환성 문제', src: 'TV 연결 로그', goals: ['onboard', 'update'] },
      { name: '연동 단계별 중도 이탈(검색·인증·등록)', why: '어느 단계에서 포기하는지 찾습니다.', rule: '가장 많이 빠지는 단계를 개선 대상으로', src: '앱 이벤트 로그', goals: ['onboard'] },
      { name: '펌웨어 업데이트 직후 연동 실패 비율', why: '"업데이트 후 연결이 안 된다"는 리뷰 신호를 확인합니다.', rule: '업데이트 직후 급증하면 배포 전 점검 필요', src: 'TV 연결 로그', goals: ['update'] },
      { name: 'TV 연동 사용자의 30일 리텐션', why: 'TV 연동이 끊긴 사용자가 앱을 덜 쓰는지 봅니다.', rule: '연동 실패 경험자가 뚜렷이 낮으면 현지화 니즈 확정', src: '앱 사용 로그', goals: ['retain'] },
    ],
    solutions: [
      { name: '연동 실패 단계별 안내', what: '같은 Wi-Fi·같은 계정·허브 지원 TV 여부를 단계마다 확인해 줍니다.', measure: '연동 단계별 중도 이탈(검색·인증·등록)', goals: ['onboard'] },
      { name: '펌웨어-앱 호환성 사전 점검', what: 'TV 펌웨어 배포 전에 앱 연동 테스트를 거칩니다.', measure: '펌웨어 업데이트 직후 연동 실패 비율', goals: ['update', 'onboard'] },
      { name: '연동 끊김 자동 복구', what: 'TV가 다시 켜지거나 업데이트된 뒤 자동으로 다시 연결합니다.', measure: 'TV 연동 사용자의 30일 리텐션', goals: ['retain'] },
    ],
  },
};

export interface Suggestion { metrics: Metric[]; solutions: Solution[]; lang: boolean }

export function suggest(market: string, topic: string, goal: Goal): Suggestion | null {
  const pool = POOL[topic];
  if (!pool) return null;
  const lang = LANG_GROUP.includes(market);
  const metrics: Metric[] = [];
  if (lang) metrics.push({ name: `국가별 ${topic} 지표 분리`, why: `${market} 리뷰는 여러 나라가 섞여 있어 어느 나라의 문제인지 알 수 없습니다. 사내 데이터로 대상 국가부터 확정합니다.`, rule: '특정 국가만 나쁘면 그 국가로 범위를 좁힘', src: '앱·기기 로그 (국가 정보)', goals: [goal] });
  metrics.push(BASE[goal](topic));
  for (const m of pool.metrics) if (m.goals.includes(goal) && !metrics.some(x => x.name === m.name)) metrics.push(m);
  const sols = pool.solutions.filter(s => s.goals.includes(goal));
  for (const s of pool.solutions) if (sols.length < 2 && !sols.includes(s)) sols.push(s);
  return { metrics: metrics.slice(0, 3), solutions: sols.slice(0, 2), lang };
}
