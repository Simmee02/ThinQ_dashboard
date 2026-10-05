// 시장 분석 · 국가별 스마트홈 앱 경쟁 현황과 경쟁 앱 장단점
//
// ## 목업데이터
// 아래 점유율·장단점은 화면 시연용으로 만든 값입니다. 실제 시장 조사 결과가 아닙니다.
// 실제로는 (1) 국가별 스마트홈 앱 점유율 자료, (2) 경쟁 앱 리뷰를 우리와 같은 방식으로 분석한 결과로 채웁니다.
// ThinQ 점유율은 src/data/usage.ts 의 app 값을 그대로 씁니다.

export interface App { pros: string[]; cons: string[] }

// ## 목업데이터 · 경쟁 앱별 강점·약점 (경쟁 앱 리뷰 분석 결과가 들어갈 자리)
export const APPS: Record<string, App> = {
  'SmartThings':     { pros: ['여러 브랜드 기기를 한 앱에서 연결', '자동화(루틴) 설정이 다양함'], cons: ['기기 추가 과정이 복잡하다는 리뷰', '업데이트 후 연결이 끊긴다는 불만'] },
  'Google Home':     { pros: ['음성 비서·스피커와 자연스럽게 연동', '첫 설정이 간단함'], cons: ['가전 세부 기능 제어가 적음', '기기가 많아지면 화면 정리가 어려움'] },
  'Amazon Alexa':    { pros: ['음성 명령으로 여러 기기를 한 번에 제어', '지원 기기 수가 많음'], cons: ['앱 메뉴 구조가 복잡함', '현지 언어 음성 인식 품질 편차'] },
  'Mi Home':         { pros: ['저가 기기가 많고 연결이 빠름', '기기별 화면이 단순함'], cons: ['서버 지역 설정에 따라 기기가 안 보임', '번역이 어색하다는 리뷰'] },
  'Smart Life':      { pros: ['다양한 저가 IoT 기기와 호환', '설정 마법사가 단계별로 안내'], cons: ['광고·알림이 많다는 불만', '대형 가전 지원이 약함'] },
  'Home Connect':    { pros: ['세탁기·식기세척기 원격 제어가 안정적', '세탁 코스 다운로드 등 가전 특화 기능'], cons: ['자사 브랜드 기기만 지원', '첫 연결 시 Wi-Fi 오류가 잦다는 리뷰'] },
  'Yandex 스마트홈': { pros: ['현지 언어 음성 비서와 통합', '현지 결제·서비스와 연동'], cons: ['가전 지원 범위가 좁음', '해외 브랜드 기기 연결이 불안정'] },
  'Apple 홈':        { pros: ['아이폰 사용자는 설정이 매우 간편', '개인정보 보호 신뢰도'], cons: ['안드로이드 미지원', '지원 가전이 적음'] },
};

// ## 목업데이터 · 국가별 스마트홈 앱 점유율 (%) · ThinQ 와 '기타'는 자동 계산
export const SHARE: Record<string, [string, number][]> = {
  '한국':           [['SmartThings', 38], ['Google Home', 6]],
  '대만':           [['Mi Home', 31], ['Google Home', 18], ['Smart Life', 14]],
  '중동(아랍어권)': [['SmartThings', 27], ['Smart Life', 19], ['Google Home', 16]],
  '네덜란드':       [['Google Home', 26], ['Home Connect', 18], ['SmartThings', 14]],
  '헝가리':         [['Mi Home', 24], ['SmartThings', 21], ['Smart Life', 15]],
  '체코':           [['Mi Home', 23], ['Home Connect', 17], ['Google Home', 16]],
  '폴란드':         [['Mi Home', 25], ['SmartThings', 19], ['Google Home', 15]],
  '튀르키예':       [['SmartThings', 29], ['Smart Life', 18], ['Mi Home', 14]],
  '러시아':         [['Yandex 스마트홈', 34], ['Mi Home', 22], ['SmartThings', 11]],
  '이탈리아':       [['Amazon Alexa', 24], ['Google Home', 21], ['Home Connect', 13]],
  '프랑스':         [['Google Home', 25], ['Amazon Alexa', 19], ['Home Connect', 14]],
  '베트남':         [['Mi Home', 28], ['SmartThings', 20], ['Smart Life', 17]],
  '독일':           [['Home Connect', 27], ['Amazon Alexa', 22], ['Google Home', 18]],
  '인도네시아':     [['SmartThings', 26], ['Mi Home', 24], ['Smart Life', 18]],
  '영어권':         [['Amazon Alexa', 27], ['Google Home', 25], ['SmartThings', 15]],
  '브라질':         [['Amazon Alexa', 26], ['SmartThings', 22], ['Google Home', 17]],
  '스페인어권':     [['Google Home', 24], ['SmartThings', 21], ['Amazon Alexa', 16]],
};
