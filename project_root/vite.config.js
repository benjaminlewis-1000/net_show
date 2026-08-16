import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Keeps the dev server on the same port CRA used, so old habits
    // (and any bookmarks/scripts pointing at :3000) keep working.
    port: 3000,
    // Also needed for the port mapping to actually reach the dev
    // server from outside the container (Vite binds to localhost-only
    // inside the container otherwise, which docker-compose's port
    // mapping can't reach).
    host: true,
    watch: {
      // Native filesystem change events frequently don't propagate
      // correctly through a Docker bind-mount volume, which can cause
      // Vite's watcher to behave erratically - missing real edits,
      // or (as suspected here) firing phantom "file changed" events
      // that trigger an unwanted full-page reload mid-execution.
      // Polling is slower/more CPU-hungry but far more reliable in
      // this environment.
      usePolling: true,
    },
  },
});