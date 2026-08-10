import { defineConfig, type Plugin } from "vite";

/**
 * Embute o CSS no HTML e remove o <link> que o bloqueava.
 *
 * A folha inteira tem ~6 KB comprimida — menos que o custo de uma ida e volta
 * a mais na rede antes da primeira pintura (medido: ~376 ms em 4G simulado).
 * Vale para esta pagina porque e uma so: o CSS deixa de ser cacheado em
 * separado, mas a maior parte das visitas vem de anuncio e e primeira visita.
 */
function inlineCss(): Plugin {
  return {
    name: "inline-css",
    enforce: "post",
    apply: "build",
    generateBundle(_opcoes, bundle) {
      const folhas = Object.values(bundle).filter(
        (a): a is typeof a & { source: string } =>
          a.type === "asset" && a.fileName.endsWith(".css")
      );
      if (folhas.length === 0) return;

      const css = folhas.map((f) => String(f.source)).join("\n");

      for (const arquivo of Object.values(bundle)) {
        if (arquivo.type !== "asset" || !arquivo.fileName.endsWith(".html")) continue;
        let html = String(arquivo.source);
        const antes = html;

        // tira os <link rel=stylesheet> que apontam para as folhas embutidas
        for (const f of folhas) {
          html = html.replace(
            new RegExp(`\\s*<link[^>]+href="[^"]*${f.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "g"),
            ""
          );
        }
        if (html === antes) {
          this.warn("inline-css: nenhum <link> de CSS encontrado no HTML — o CSS pode ter ficado duplicado");
        }
        arquivo.source = html.replace("</head>", `<style>${css}</style>\n</head>`);
      }

      // as folhas ja estao dentro do HTML; nao precisam ir para o dist
      for (const f of folhas) delete bundle[f.fileName];
    },
  };
}

export default defineConfig({
  plugins: [inlineCss()],
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
