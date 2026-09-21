import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Force strict spatial physical chunk separation for admin modules
            if (
              id.includes('/admin/') || 
              id.includes('adminService') || 
              id.includes('AdminLayout')
            ) {
              return 'kibabiimarket-admin';
            }
          },
        },
      },
    },
    server: {
      // Explicitly disable HMR to prevent WebSocket disconnect loops and frequent page reloads
      hmr: false,
      watch: {
        ignored: ['**/*'],
      },
    },
  };
});
