import "./styles/main.css";
import { bindCtaTracking, captureAttribution, initAnalytics } from "./modules/analytics";
import { initForm, initPerfilPresets, initWhatsAppFloat } from "./modules/form";
import { initHeadlineVariant } from "./modules/variants";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("js");

initAnalytics();
captureAttribution();
initHeadlineVariant();
initWhatsAppFloat();
initPerfilPresets();
initForm();
bindCtaTracking();

if (reduced) {
  // sem movimento: nada de GSAP/Lenis na rede, e o preloader sai na hora
  document.getElementById("preloader")?.remove();

  // os numeros sao conteudo, nao enfeite — escreve o valor final direto,
  // senao quem pediu menos movimento le "0 m" no lugar de "250 m"
  const fmt = new Intl.NumberFormat("pt-BR");
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    el.textContent = fmt.format(Number(el.dataset.count ?? 0)) + (el.dataset.suffix ?? "");
  });

  // o <details> do FAQ funciona nativamente; so garante que nada ficou colapsado
  document.querySelectorAll<HTMLElement>(".faq__a").forEach((p) => p.style.removeProperty("height"));
} else {
  void import("./modules/motion").then((m) => m.initMotion());
}
