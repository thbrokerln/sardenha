import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cabecalho, Chip, Selo, Vazio } from "@/components/ui";
import { brl, dataCurta, ETAPAS, nomeEtapa } from "@/lib/format";
import { mudarEtapa } from "../actions";

export const dynamic = "force-dynamic";

const FECHAMENTO: Record<string, string> = {
  escritura: "Escritura",
  financiamento: "Financiamento",
  permuta: "Permuta",
  contrato_locacao: "Locação",
};

export default async function NegociosPage({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  const { etapa: etapaParam } = await searchParams;
  const supabase = await createClient();

  const { data: todos } = await supabase
    .from("negocios")
    .select(
      "id, etapa, valor, tipo_fechamento, split_parceiro_pct, criado_em, clientes(id, nome), imoveis(titulo, bairro), empreendimentos(nome), tipologias(nome), parceiros(nome)"
    )
    .order("atualizado_em", { ascending: false });

  const lista = todos ?? [];
  const contagem = new Map<string, number>();
  lista.forEach((n) => contagem.set(n.etapa, (contagem.get(n.etapa) ?? 0) + 1));

  const etapa = etapaParam && ETAPAS.some((e) => e.id === etapaParam) ? etapaParam : null;
  const filtrados = etapa ? lista.filter((n) => n.etapa === etapa) : lista.filter((n) => !["fechado", "perdido"].includes(n.etapa));
  const vgvAberto = lista
    .filter((n) => ["proposta", "negociacao", "documentacao"].includes(n.etapa))
    .reduce((s, n) => s + Number(n.valor ?? 0), 0);

  return (
    <div>
      <Cabecalho titulo="Negócios" sub={`Em negociação: ${brl(vgvAberto)}`} />
      <div className="border-b border-borda bg-white px-4 pb-3">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1">
          <Chip href="/negocios" ativo={!etapa}>Abertos</Chip>
          {ETAPAS.map((e) => (
            <Chip key={e.id} href={`/negocios?etapa=${e.id}`} ativo={etapa === e.id}>
              {e.nome} {contagem.get(e.id) ?? 0}
            </Chip>
          ))}
        </div>
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4">
        {filtrados.length === 0 && <Vazio texto="Nenhum negócio nesta etapa." acao={{ href: "/novo", rotulo: "Novo lead" }} />}
        {filtrados.map((n) => {
          const c = n.clientes as unknown as { id: string; nome: string } | null;
          const i = n.imoveis as unknown as { titulo: string | null; bairro: string } | null;
          const e = n.empreendimentos as unknown as { nome: string } | null;
          const t = n.tipologias as unknown as { nome: string } | null;
          const p = n.parceiros as unknown as { nome: string } | null;
          const idx = ETAPAS.findIndex((x) => x.id === n.etapa);
          const progresso = Math.round(((idx + 1) / 8) * 100);
          return (
            <article key={n.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(11,37,69,0.08)]">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/clientes/${c?.id}`} className="text-[15px] font-bold">{c?.nome ?? "Cliente"}</Link>
                <Selo tom={n.etapa === "proposta" || n.etapa === "negociacao" ? "quente" : n.etapa === "fechado" ? "ok" : "azul"}>
                  {nomeEtapa(n.etapa)}
                </Selo>
              </div>
              <span className="text-[13px] text-suave">
                {[e?.nome, t?.nome, i?.titulo, i?.bairro].filter(Boolean).join(" · ") || "Imóvel a definir"}
              </span>
              <div className="flex justify-between text-[13px]">
                <span>Valor <b>{brl(n.valor)}</b></span>
                <span className="text-suave">{n.tipo_fechamento ? FECHAMENTO[n.tipo_fechamento] : `desde ${dataCurta(n.criado_em)}`}</span>
              </div>
              {n.etapa !== "perdido" && (
                <div className="h-1.5 overflow-hidden rounded bg-gelo">
                  <div className="h-1.5 bg-navy" style={{ width: `${Math.min(progresso, 100)}%` }} />
                </div>
              )}
              <span className="text-xs text-suave">
                {p ? `Parceiro: ${p.nome} (${n.split_parceiro_pct ?? 50}%)` : "Sem parceiro"}
              </span>
              <form action={mudarEtapa} className="mt-1 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={n.id} />
                <label className="sr-only" htmlFor={`etapa-${n.id}`}>Mudar etapa</label>
                <select
                  id={`etapa-${n.id}`}
                  name="etapa"
                  defaultValue={n.etapa}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#C9D2DE] bg-white px-3 text-sm"
                >
                  {ETAPAS.map((x) => (
                    <option key={x.id} value={x.id}>{x.nome}</option>
                  ))}
                </select>
                <input
                  name="motivo"
                  placeholder="Motivo (se perdido)"
                  aria-label="Motivo da perda"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#C9D2DE] px-3 text-sm"
                />
                <button className="h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white">Salvar</button>
              </form>
            </article>
          );
        })}
      </main>
    </div>
  );
}
