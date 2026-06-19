/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || "http://localhost:3000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Pedidos para /api são reencaminhados para o backend NestJS
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./__tests__/setup.ts"],
      include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
      css: false,
      coverage: {
        provider: "v8",
        reportsDirectory: "./coverage",
        include: ["src/**/*.{ts,tsx}"],
      },
    },
  };
});
