import Link from "next/link";
import { iniciais } from "@/lib/format";

export function Cabecalho({ titulo, sub, direita }: { titulo: string; sub?: string; direita?: React.ReactNode }) {
  return (
    <header className="border-b border-borda bg-white px-5 pb-4 pt-12 md:pt-8">
      <div className="mx-auto flex max-w-3xl items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">{titulo}</h1>
          {sub && <p className="mt-0.5 text-sm text-suave">{sub}</p>}
        </div>
        {direita}
      </div>
    </header>
  );
}

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(11,37,69,0.08)] ${className}`}>{children}</section>;
}

export function Avatar({ nome }: { nome: string | null | undefined }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gelo text-sm font-bold text-navy">
      {iniciais(nome)}
    </span>
  );
}

export function Selo({ children, tom = "neutro" }: { children: React.ReactNode; tom?: "quente" | "neutro" | "ok" | "azul" }) {
  const cores = {
    quente: "bg-quente-bg text-quente",
    neutro: "bg-[#EEF1F5] text-suave",
    ok: "bg-green-50 text-ok",
    azul: "bg-gelo text-navy-2",
  }[tom];
  return <span className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-bold ${cores}`}>{children}</span>;
}

export function Vazio({ texto, acao }: { texto: string; acao?: { href: string; rotulo: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-borda bg-white p-6 text-center text-sm text-suave">
      <p>{texto}</p>
      {acao && (
        <Link href={acao.href} className="mt-3 inline-flex h-11 items-center rounded-xl bg-navy px-4 font-bold text-white">
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}

export function Chip({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] ${
        ativo ? "bg-navy font-bold text-white" : "border border-[#C9D2DE] bg-white font-semibold text-tinta"
      }`}
    >
      {children}
    </Link>
  );
}
