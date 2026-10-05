// 현지화 기회 조사 결과 · 팀이 조사한 내용을 직접 채우는 파일
// 비어 있으면 화면에 '조사 전'으로 표시됩니다. 출처(source)는 꼭 남겨 주세요.
//
// 예시 1 · 경쟁 앱 비교: 가전은 쓰는데 ThinQ는 덜 쓰는 이유를 그 나라 1위 스마트홈 앱에서 찾기
//   competitors: [{ app: '앱 이름', basis: '1위로 본 근거', pros: ['강점'], cons: ['약점'], chance: 'ThinQ가 얻을 수 있는 기회', source: '출처' }]
// 예시 2 · 현지 기능 공백: 그 나라 특화 가전·기능이 ThinQ에 반영됐는지 확인하기
//   devices: [{ device: '현지 특화 가전·기능', note: '설명', inThinq: '미지원', source: '출처' }]

export interface Competitor { app: string; basis: string; pros: string[]; cons: string[]; chance: string; source: string }
export interface LocalDevice { device: string; note: string; inThinq: '지원' | '일부 지원' | '미지원' | '확인 필요'; source: string }
export interface Opp { competitors: Competitor[]; devices: LocalDevice[] }

export const OPP: Record<string, Opp> = {
  '한국': { competitors: [], devices: [] },
  '대만': { competitors: [], devices: [] },
  '중동(아랍어권)': { competitors: [], devices: [] },
  '네덜란드': { competitors: [], devices: [] },
  '헝가리': { competitors: [], devices: [] },
  '체코': { competitors: [], devices: [] },
  '폴란드': { competitors: [], devices: [] },
  '튀르키예': { competitors: [], devices: [] },
  '러시아': { competitors: [], devices: [] },
  '이탈리아': { competitors: [], devices: [] },
  '프랑스': { competitors: [], devices: [] },
  '베트남': { competitors: [], devices: [] },
  '독일': { competitors: [], devices: [] },
  '인도네시아': { competitors: [], devices: [] },
  '영어권': { competitors: [], devices: [] },
  '브라질': { competitors: [], devices: [] },
  '스페인어권': { competitors: [], devices: [] }
};
