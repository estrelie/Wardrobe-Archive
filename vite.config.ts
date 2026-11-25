import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 브라우저 저장소(옷장 데이터)는 주소(포트)별로 따로 저장된다.
  // 포트를 고정해 두면 개발 서버(npm run dev)와 미리보기(npm start)가 같은 데이터를 쓰고,
  // 포트가 사용 중이면 조용히 다른 포트로 열리는 대신 오류로 알려준다.
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
})
