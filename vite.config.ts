// @lovable.dev/vite-tanstack-config already includes the Vite, React,
// Tailwind, TanStack Start and Nitro plugins. Do not register them twice.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Enable Nitro outside Lovable and select Vercel's preset during Vercel builds.
// Let Nitro choose its own output directories for the Vercel Build Output API.
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    // Keep the server entry that wraps SSR errors.
    server: { entry: "server" },
  },
  nitro: isVercel ? { preset: "vercel" } : true,
});
