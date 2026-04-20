import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      // Prevent TanStack Start's dev style collector from recompiling
      // tailwindcss/index.css as a standalone file (which generates duplicate
      // dark-mode utilities using prefers-color-scheme instead of the .dark class).
      // The global.css compilation already includes the full Tailwind output.
      name: "dedupe-tailwind-css",
      enforce: "pre",
      transform: {
        filter: { id: /node_modules\/tailwindcss\/index\.css/ },
        handler() {
          return { code: "/* deduplicated — compiled via global.css */", map: null };
        },
      },
    },
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
    }),
    nitro({ preset: "vercel" }),
    react(),
  ],
});
