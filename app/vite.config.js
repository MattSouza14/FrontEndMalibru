import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, 'API_');
  const target = env.API_PROXY_TARGET || 'http://localhost:8080';
  const parsed = new URL(target);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('API_PROXY_TARGET deve usar HTTP ou HTTPS.');
  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true, proxy: { '/api': { target, changeOrigin: true } } },
    preview: { port: 4173, strictPort: true },
    build: { manifest: true },
  };
});
