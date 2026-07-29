// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/TeamBoard/",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
