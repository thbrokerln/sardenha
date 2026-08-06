import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = "power3.out";
const fine = () => matchMedia("(min-width: 861px) and (pointer: fine)").matches;

/* ----------------------------------------------------- scroll com inercia */
function initSmoothScroll(): void {
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ancoras internas passam pelo Lenis para nao brigar com o scroll suave
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -70, duration: 1.1 });
      history.replaceState(null, "", id);
    });
  });
}

/* --------------------------------------------------------------- preloader */
function runPreloader(onDone: () => void): void {
  const el = document.getElementById("preloader");
  if (!el) return onDone();

  let seen = false;
  try {
    seen = sessionStorage.getItem("sardenha:seen") === "1";
    sessionStorage.setItem("sardenha:seen", "1");
  } catch {
    /* modo privado: mostra o preloader normalmente */
  }

  if (seen) {
    el.remove();
    return onDone();
  }

  const line = el.querySelector(".preloader__line i");
  const name = el.querySelector(".preloader__name");

  gsap
    .timeline({ onComplete: () => { el.remove(); onDone(); } })
    .from(name, { yPercent: 40, opacity: 0, duration: 0.6, ease: EASE })
    .to(line, { scaleX: 1, duration: 0.62, ease: "power2.inOut" }, 0.12)
    .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.62, ease: "power3.inOut" }, "+=0.05");
}

/* -------------------------------------------------- barra de progresso topo */
function initHorizonBar(): void {
  const bar = document.querySelector(".horizon-bar i");
  if (!bar) return;
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.25 },
  });
}

/* --------------------------------------------------------------------- nav */
function initNav(): void {
  const nav = document.getElementById("nav");
  if (!nav) return;
  let last = 0;

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle("is-solid", y > 40);
      // esconde ao descer, revela ao subir — nunca esconde perto do topo
      nav.classList.toggle("is-hidden", y > last && y > 420);
      last = y;
    },
  });
}

/* -------------------------------------------------------------------- hero */
function initHero(): void {
  const h1 = document.querySelector<HTMLElement>("[data-hero-h1]");

  gsap.set(".hero__body .lead, .hero__cta", { y: 22 });
  const tl = gsap.timeline({ delay: 0.05 });

  if (h1) {
    const split = new SplitText(h1, { type: "lines", mask: "lines", linesClass: "line" });
    tl.from(split.lines, { yPercent: 108, duration: 1.05, stagger: 0.09, ease: EASE });
  }

  tl.to(".hero__body .eyebrow", { opacity: 1, duration: 0.5 }, 0)
    .to(".hero__body .lead", { opacity: 1, y: 0, duration: 0.8, ease: EASE }, "-=0.5")
    .to(".hero__cta", { opacity: 1, y: 0, duration: 0.8, ease: EASE }, "-=0.6");

  // ken burns lento
  gsap.fromTo(
    ".hero__media img",
    { scale: 1.0 },
    { scale: 1.07, duration: 14, ease: "none", repeat: -1, yoyo: true }
  );

  // saida por scroll
  gsap.timeline({
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  })
    .to(".hero__body", { yPercent: -22, opacity: 0, ease: "none" }, 0)
    .to(".hero__media img", { yPercent: 12, ease: "none" }, 0);

  gsap.to(".hero__scroll", {
    y: 7,
    duration: 1.1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

/* ----------------------------------------------------- reveals de conteudo */
function initReveals(): void {
  gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 86%" },
        onComplete: () => el.style.removeProperty("will-change"),
      }
    );
  });

  // imagens entram com mascara + leve zoom-out
  gsap.utils.toArray<HTMLElement>(".split__media img, .unit__media img").forEach((img) => {
    gsap.fromTo(
      img,
      { clipPath: "inset(0 0 100% 0)", scale: 1.08 },
      {
        clipPath: "inset(0 0 0% 0)",
        scale: 1,
        duration: 1.25,
        ease: "power3.inOut",
        scrollTrigger: { trigger: img, start: "top 88%" },
      }
    );
  });

  // titulos de secao linha a linha
  gsap.utils.toArray<HTMLElement>(".sec-head .display, .split .display").forEach((h) => {
    const split = new SplitText(h, { type: "lines", mask: "lines" });
    gsap.from(split.lines, {
      yPercent: 105,
      duration: 0.95,
      stagger: 0.07,
      ease: EASE,
      scrollTrigger: { trigger: h, start: "top 88%" },
    });
  });
}

/* ---------------------------------------------------------------- numeros */
function initCounters(): void {
  const fmt = new Intl.NumberFormat("pt-BR");
  gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count ?? 0);
    const suffix = el.dataset.suffix ?? "";
    const state = { v: 0 };
    gsap.to(state, {
      v: end,
      duration: 1.7,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => {
        el.textContent = fmt.format(Math.round(state.v)) + suffix;
      },
    });
  });
}

/* ------------------------------------------------- galeria horizontal (pin) */
function initGallery(): void {
  const viewport = document.querySelector<HTMLElement>("[data-gallery]");
  const track = document.querySelector<HTMLElement>("[data-gallery-track]");
  const hint = document.querySelector<HTMLElement>("[data-gallery-hint]");
  if (!viewport || !track) return;

  if (!fine()) return; // mobile/touch fica com scroll-snap nativo

  viewport.classList.add("is-pinned");
  if (hint) hint.textContent = "Role para percorrer";

  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: viewport,
      start: "center center",
      end: () => `+=${distance()}`,
      pin: ".gallery",
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
}

/* -------------------------------------------------------- sticky cta bar */
function initStickyCta(): void {
  const bar = document.getElementById("stickyCta");
  const form = document.getElementById("contato");
  if (!bar || !form) return;

  ScrollTrigger.create({
    trigger: ".hero",
    start: "bottom 70%",
    onEnter: () => bar.classList.add("is-in"),
    onLeaveBack: () => bar.classList.remove("is-in"),
  });
  // recolhe quando o formulario aparece — nao competir com a propria conversao
  ScrollTrigger.create({
    trigger: form,
    start: "top 85%",
    onEnter: () => bar.classList.remove("is-in"),
    onLeaveBack: () => bar.classList.add("is-in"),
  });
}

/* ------------------------------------------------ cursor + botao magnetico */
function initPointerFlourish(): void {
  if (!fine()) return;

  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursor);

  const x = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
  const y = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
  addEventListener(
    "pointermove",
    (e) => {
      if (!cursor.classList.contains("is-live")) {
        // primeiro movimento: posiciona sem animar, depois revela
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        cursor.classList.add("is-live");
      }
      x(e.clientX);
      y(e.clientY);
    },
    { passive: true }
  );

  const grow = (label: string) =>
    gsap.to(cursor, { scale: 2.1, backgroundColor: "rgba(253,250,245,.12)", duration: 0.3, ease: EASE,
      onStart: () => { cursor.textContent = label; cursor.style.color = label ? "#fdfaf5" : "transparent"; } });
  const shrink = () =>
    gsap.to(cursor, { scale: 1, backgroundColor: "rgba(0,0,0,0)", duration: 0.3, ease: EASE,
      onComplete: () => { cursor.textContent = ""; } });

  document.querySelectorAll<HTMLElement>("a, button, summary").forEach((el) => {
    el.addEventListener("pointerenter", () => grow(""));
    el.addEventListener("pointerleave", shrink);
  });
  document.querySelectorAll<HTMLElement>(".gcard, .plan").forEach((el) => {
    el.addEventListener("pointerenter", () => grow("ver"));
    el.addEventListener("pointerleave", shrink);
  });

  // botoes magneticos
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
    const mx = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
    const my = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * 0.28);
      my((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    btn.addEventListener("pointerleave", () => { mx(0); my(0); });
  });
}

/* ------------------------------------------------------------------- FAQ */
function initFaq(): void {
  document.querySelectorAll<HTMLDetailsElement>(".faq__item").forEach((item) => {
    const panel = item.querySelector<HTMLElement>(".faq__a");
    if (!panel) return;
    gsap.set(panel, { height: 0 });

    item.querySelector("summary")!.addEventListener("click", (e) => {
      e.preventDefault();
      const opening = !item.open;

      if (opening) {
        item.open = true;
        gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 0.45, ease: "power2.out" });
      } else {
        gsap.to(panel, {
          height: 0,
          duration: 0.35,
          ease: "power2.inOut",
          onComplete: () => { item.open = false; },
        });
      }
    });
  });
}

/* ------------------------------------------------------------------ boot */
export function initMotion(): void {
  initSmoothScroll();
  initFaq();

  // cada bloco e isolado: uma falha em um efeito nao pode derrubar os outros
  const steps: Array<[string, () => void]> = [
    ["horizonBar", initHorizonBar],
    ["nav", initNav],
    ["hero", initHero],
    ["reveals", initReveals],
    ["counters", initCounters],
    ["gallery", initGallery],
    ["stickyCta", initStickyCta],
    ["pointer", initPointerFlourish],
  ];

  const start = () => {
    for (const [name, fn] of steps) {
      try {
        fn();
      } catch (err) {
        console.error(`[motion] falhou em "${name}":`, err);
      }
    }
    ScrollTrigger.refresh();
  };

  // espera as fontes para o SplitText quebrar as linhas no lugar certo
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => runPreloader(start));
  } else {
    runPreloader(start);
  }

  addEventListener("load", () => ScrollTrigger.refresh());
}
