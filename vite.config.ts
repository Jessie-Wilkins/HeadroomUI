import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const allowedHosts = ["krabshangout.taile80141.ts.net"];

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    allowedHosts,
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4174"
    }
  },
  preview: {
    host: "127.0.0.1",
    allowedHosts,
    port: 4173,
    proxy: {
      "/api": "http://127.0.0.1:4174"
    }
  }
});
