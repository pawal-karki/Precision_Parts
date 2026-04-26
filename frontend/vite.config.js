import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Browser hits same-origin /api/...; forward to Kestrel. Use 127.0.0.1 to avoid ::1 vs IPv4 mismatches.
      // 502 Bad Gateway here almost always means nothing is listening — run: dotnet run --launch-profile http (CleanApp.API).
      "/api": {
        target: "http://127.0.0.1:5147",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (err) => {
            console.error(
              "\n[vite] /api proxy: cannot reach http://127.0.0.1:5147 — start the .NET API (backend/CleanApp.API): dotnet run --launch-profile http\n",
              err?.message || err,
            );
          });
        },
      },
      "/uploads": {
        target: "http://127.0.0.1:5147",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (err) => {
            console.error(
              "\n[vite] /uploads proxy: cannot reach http://127.0.0.1:5147\n",
              err?.message || err,
            );
          });
        },
      },
    },
  },
});
