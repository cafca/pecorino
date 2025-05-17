import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/__tests__/**/*.{test,spec}.ts"],
    exclude: ["tests/**/*", "**/node_modules/**"],
    tsconfig: "./tsconfig.test.json",
  },
});
