import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: minimal2023Preset,
  // PNGs are emitted next to this source image, i.e. into public/.
  images: ["public/favicon.svg"],
});
