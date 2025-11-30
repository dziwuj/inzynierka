import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

const selfDestroying = process.env.SW_DESTROY === "true";

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };

  const isDevelopment = process.env.SW_DEV === "true";
  const keyPath = path.resolve(__dirname, "../certs/localhost-key.pem");
  const certPath = path.resolve(__dirname, "../certs/localhost.pem");
  const certificatesExist = fs.existsSync(keyPath) && fs.existsSync(certPath);

  return defineConfig({
    build: {
      sourcemap: process.env.SOURCE_MAP === "true",
    },
    plugins: [
      react(),
      svgr(),
      VitePWA({
        mode: "development",
        base: "/",
        srcDir: "src",
        filename: "sw.ts",
        strategies: "injectManifest",
        registerType: "autoUpdate",
        selfDestroying: selfDestroying,
        manifest: {
          name: "3D Model Viewer",
          short_name: "3D Model Viewer",
          description: "App for engeneering thesis",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "/Logo-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "/Logo-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/Logo-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/Logo-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*"],
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
        },
        includeAssets: ["**/*"],
        devOptions: {
          enabled: isDevelopment,
          type: "module",
          navigateFallback: "index.html",
        },
      }),
    ],
    server:
      isDevelopment && certificatesExist
        ? {
            https: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
            host: "0.0.0.0",
            proxy: {
              "/api": {
                target: process.env.VITE_API_URL,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {
            host: "0.0.0.0",
          },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@styles": path.resolve(__dirname, "src/styles"),
        "@assets": path.resolve(__dirname, "src/assets"),
        "@stores": path.resolve(__dirname, "src/stores"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@api": path.resolve(__dirname, "src/api"),
        "@constants": path.resolve(__dirname, "src/constants"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@routes": path.resolve(__dirname, "src/routes"),
      },
    },
  });
};
