"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; nome: string; icone: React.ReactNode };

const s = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ITENS: Item[] = [
  { href: "/", nome: "Hoje", icone: <svg {...s}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg> },
  { href: "/conversas", nome: "Conversas", icone: <svg {...s}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg> },
  { href: "/imoveis", nome: "Imóveis", icone: <svg {...s}><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /></svg> },
  { href: "/negocios", nome: "Negócios", icone: <svg {...s}><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="7" rx="1" /></svg> },
  { href: "/mais", nome: "Mais", icone: <svg {...s}><path d="M4 6h16M4 12h16M4 18h16" /></svg> },
];

function ativo(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-borda bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITENS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${
            ativo(path, i.href) ? "font-bold text-navy" : "font-semibold text-suave"
          }`}
        >
          {i.icone}
          {i.nome}
        </Link>
      ))}
    </nav>
  );
}

const LATERAL = [
  ...ITENS.slice(0, 4),
  { href: "/clientes", nome: "Clientes", icone: null },
  { href: "/proprietarios", nome: "Proprietários", icone: null },
  { href: "/mais", nome: "Mais", icone: null },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu lateral" className="hidden md:flex w-60 shrink-0 flex-col gap-1 bg-navy p-4 text-white min-h-dvh">
      <span className="mb-6 px-3 pt-2 text-xs font-semibold tracking-[0.12em] opacity-80">GRUPO TH IMÓVEIS</span>
      {LATERAL.map((i) => (
        <Link
          key={i.nome}
          href={i.href}
          className={`rounded-lg px-3 py-2.5 text-sm ${ativo(path, i.href) ? "bg-white/15 font-bold" : "opacity-85 hover:bg-white/10"}`}
        >
          {i.nome}
        </Link>
      ))}
    </nav>
  );
}

export function Fab() {
  return (
    <Link
      href="/novo"
      aria-label="Novo lead"
      className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-lg md:bottom-8 md:right-8"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}
