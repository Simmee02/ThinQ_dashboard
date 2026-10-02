/// <reference types="vite/client" />

declare module '*.html?raw' {
  const html: string;
  export default html;
}

interface Window {
  // 글로벌 VoC 동향의 캘린더 기간 → 시장 현황 표가 읽는다
  __vocRange?: { from: number; to: number; total: number };
}

// aria-pressed 등에 true/false를 그대로 넘기는 코드가 많아 값 타입을 넓힌다
interface Element {
  setAttribute(qualifiedName: string, value: any): void;
}
