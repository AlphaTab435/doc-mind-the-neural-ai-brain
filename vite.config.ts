
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' to specify the search directory for environment variables, avoiding potential type errors with process.cwd()
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Expose the API_KEY environment variable to the frontend application via process.env
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || env.VITE_API_KEY)
    }
  };
});
