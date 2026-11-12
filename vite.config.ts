// @lovable.dev/vite-tanstack-config already includes the Vite, React,
// Tailwind, TanStack Start and Nitro plugins. Do not register them twice.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Keep Lovable's own preview target, but explicitly generate Vercel output
// when this project is built by Vercel.
const isLovableSandbox =
  process.env.LOVABLE_SANDBOX === "1" || !!process.env.DEV_SERVER__PROJECT_PATH;

export default defineConfig({
  tanstackStart: {
    // Use the server entry that wraps SSR errors.
    server: { entry: "server" },
  },
  ...(isLovableSandbox
    ? {}
    : {
        nitro: {
          preset: "vercel",
          output: {
            dir: ".vercel/output",
            serverDir: ".vercel/output/functions/__server.func",
            publicDir: ".vercel/output/static",
          },
        },
      }),
});
