import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    cssMinify: "lightningcss",
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // separa o motor de animacao do codigo da pagina para cachear melhor
        manualChunks: {
          motion: ["gsap", "gsap/ScrollTrigger", "gsap/SplitText", "lenis"],
        },
      },
    },
  },
});
