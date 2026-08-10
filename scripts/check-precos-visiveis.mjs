/** Confere que os dois precos aparecem SEM nenhum clique, em cada viewport. */
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars"] });
for (const [rot, w, h, m] of [["mobile 390", 390, 844, true], ["desktop 1440", 1440, 900, false]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: m, hasTouch: m });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto(process.argv[2] ?? "http://localhost:4173/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 2600));
  const r = await p.evaluate(() => ({
    heroPrecos: [...document.querySelectorAll(".hero__gancho strong")].map((e) => e.textContent),
    abasPrecos: [...document.querySelectorAll(".pagto__tab-preco")].map((e) => e.textContent),
    sticky: document.querySelector(".sticky-cta span")?.innerText.replace(/\s+/g, " "),
    waTexto: decodeURIComponent(new URL(document.getElementById("waFloat").href).searchParams.get("text")),
  }));
  console.log(`\n[${rot}]`);
  console.log("  hero:", r.heroPrecos.join("  |  "));
  console.log("  abas:", r.abasPrecos.join("  |  "), "  <- visiveis sem clique");
  console.log("  barra fixa:", r.sticky);
  if (rot.startsWith("mobile")) {
    console.log("\n  --- mensagem do botao flutuante ---");
    console.log(r.waTexto.split("\n").map((l) => "  | " + l).join("\n"));
  }
  await p.close();
}
await b.close();
