import Link from "next/link";
import { Cabecalho } from "@/components/ui";
import { sair } from "../actions";

const ITENS = [
  { href: "/clientes", nome: "Clientes", pronto: true },
  { href: "/proprietarios", nome: "Proprietários", pronto: true },
  { href: "/em-breve/agenda", nome: "Agenda", pronto: false },
  { href: "/em-breve/documentos", nome: "Documentos", pronto: false },
  { href: "/em-breve/locacao", nome: "Locação e Administração", pronto: false },
  { href: "/em-breve/financeiro", nome: "Financeiro", pronto: false },
  { href: "/em-breve/parceiros", nome: "Parceiros", pronto: false },
  { href: "/em-breve/conteudo", nome: "Conteúdo", pronto: false },
  { href: "/em-breve/trafego", nome: "Tráfego", pronto: false },
  { href: "/em-breve/sites", nome: "Sites de Lançamento", pronto: false },
  { href: "/em-breve/mercado", nome: "Mercado", pronto: false },
  { href: "/em-breve/agentes", nome: "Agentes", pronto: false },
  { href: "/em-breve/relatorios", nome: "Relatórios", pronto: false },
  { href: "/em-breve/configuracoes", nome: "Configurações", pronto: false },
];

export default function MaisPage() {
  return (
    <div>
      <Cabecalho titulo="Mais" />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4">
        <div className="flex flex-col rounded-2xl bg-white px-4">
          {ITENS.map((i) => (
            <Link key={i.href} href={i.href} className="flex min-h-14 items-center justify-between border-b border-[#EEF1F5] text-[15px] font-semibold last:border-0">
              {i.nome}
              {!i.pronto && <span className="text-xs font-semibold text-suave">em breve</span>}
            </Link>
          ))}
        </div>
        <form action={sair}>
          <button className="h-12 w-full rounded-xl border border-[#C9D2DE] bg-white text-sm font-semibold">Sair</button>
        </form>
      </main>
    </div>
  );
}
