import { defineConfig } from "@vite-pwa/assets-generator/config";

// The source icon is already full-bleed (opaque background to all edges) with
// the K inside the maskable safe zone, so we use 0 padding everywhere instead
// of the default preset's 30% — that padding is what left empty margins and
// made the icon look not-full-bleed once masked. The solid background is a
// safety net in case any resize introduces transparent edges.
const background = "#16161e";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
    },
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: { background },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background },
    },
  },
  // PNGs are emitted next to this source image, i.e. into public/.
  images: ["public/favicon.svg"],
});
