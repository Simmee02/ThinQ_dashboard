// ThinQ 사용 현황 · 국가별 LG 가전 점유율 / ThinQ 사용률 / 점유율 대비 사용률
//
// ## 목업데이터
// 아래 숫자는 화면 시연용으로 만든 값입니다. 실제 점유율·사용률이 아닙니다.
// 사내 데이터(국가별 LG 가전 판매·보급, ThinQ 활성 사용자)를 받으면 이 파일의 값만 바꾸면 됩니다.
//
// share : LG 가전 점유율 (%) · 해당 국가 가전 시장에서 LG가 차지하는 비중
// usage : ThinQ 사용률 (%)  · 해당 국가 가구 중 ThinQ 앱을 쓰는 가구 비율
// app   : ThinQ 앱 점유율 (%) · 해당 국가 스마트홈 앱 사용자 중 ThinQ 비중
// 점유율 대비 사용률 = usage ÷ share · LG 가전을 가진 가구 중 대략 몇 할이 ThinQ를 쓰는지

export interface Usage { share: number; usage: number; app: number }

// ## 목업데이터
export const USAGE: Record<string, Usage> = {
  '한국':           { share: 38, usage: 21.0, app: 46 },
  '대만':           { share: 12, usage: 4.1, app: 14 },
  '중동(아랍어권)': { share: 18, usage: 5.0, app: 12 },
  '네덜란드':       { share: 9,  usage: 3.2, app: 9 },
  '헝가리':         { share: 11, usage: 2.9, app: 8 },
  '체코':           { share: 10, usage: 3.0, app: 9 },
  '폴란드':         { share: 13, usage: 4.3, app: 12 },
  '튀르키예':       { share: 15, usage: 3.6, app: 10 },
  '러시아':         { share: 14, usage: 4.6, app: 13 },
  '이탈리아':       { share: 10, usage: 3.7, app: 10 },
  '프랑스':         { share: 9,  usage: 3.4, app: 9 },
  '베트남':         { share: 22, usage: 5.5, app: 15 },
  '독일':           { share: 7,  usage: 2.9, app: 7 },
  '인도네시아':     { share: 16, usage: 3.4, app: 9 },
  '영어권':         { share: 12, usage: 5.4, app: 11 },
  '브라질':         { share: 19, usage: 4.2, app: 10 },
  '스페인어권':     { share: 17, usage: 4.4, app: 11 },
};

export const ratio = (u: Usage) => u.usage / u.share;
// 17개 시장 평균 (점유율 대비 사용률)
export const RATIO_AVG = Object.values(USAGE).reduce((s, u) => s + ratio(u), 0) / Object.keys(USAGE).length;
