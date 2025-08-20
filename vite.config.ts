import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    port: 5173,
    host: "localhost",
    strictPort: true,
    hmr: {
      port: 5173,
      host: "localhost",
    },
    watch: {
      usePolling: false,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/*.log",
        "**/coverage/**",
        "**/.env*",
        "**/package-lock.json",
        "**/yarn.lock",
        "**/Dashboard.old.tsx",
        "**/Dashboard.new.tsx"
      ]
    },
  },
});
