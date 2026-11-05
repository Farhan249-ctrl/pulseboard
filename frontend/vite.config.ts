import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(process.env.VITE_DEV_PORT || '5174'),
      strictPort: true,
      proxy: isDev ? {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        }
      } : undefined,
    },
  };
});
