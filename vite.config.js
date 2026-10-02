import { defineConfig } from 'vite';

export default defineConfig({
  // 어느 경로에 올려도 동작하도록 상대 경로로 빌드 (예: GitHub Pages 하위 폴더)
  base: './',
  build: {
    target: 'es2022',   // main.js의 top-level await 사용
    assetsInlineLimit: 0, // 폰트는 파일로 유지
  },
});
