import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("console", (m) => { if (m.type() === "error") console.log("console.error:", m.text()); });
const reqs = [];
p.on("request", (r) => { const u = r.url(); if (u.includes("facebook")) reqs.push(u.slice(0, 90)); });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:4173/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 3000));
console.log(JSON.stringify({
  temFbq: await p.evaluate(() => typeof window.fbq),
  waFloat: await p.evaluate(() => !!document.getElementById("waFloat")),
  idsWa: await p.evaluate(() => [...document.querySelectorAll('[id*="wa" i], .wa, [class*="whats" i]')].map(e => e.id || e.className).slice(0,5)),
  reqsFacebook: reqs,
}, null, 1));
await b.close();
