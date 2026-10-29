import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cabecalho, Chip, Selo, Vazio } from "@/components/ui";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const ABAS = [
  { id: "venda", nome: "Venda" },
  { id: "locacao", nome: "Locação" },
  { id: "temporada", nome: "Temporada" },
  { id: "lancamento", nome: "Lançamentos" },
];

type Tipologia = { nome: string; area_m2: number | null; suites: number | null; quartos: number | null; preco_a_partir: number | null };

export default async function ImoveisPage({ searchParams }: { searchParams: Promise<{ aba?: string; c?: string }> }) {
  const { aba: abaParam, c: construtora } = await searchParams;
  const aba = ABAS.some((a) => a.id === abaParam) ? abaParam! : "lancamento";
  const supabase = await createClient();

  return (
    <div>
      <Cabecalho
        titulo="Imóveis"
        direita={
          <Link href="/imoveis/novo" className="inline-flex h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white">
            + Imóvel
          </Link>
        }
      />
      <div role="tablist" aria-label="Finalidade" className="grid grid-cols-4 border-b border-borda bg-white">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            role="tab"
            aria-selected={aba === a.id}
            href={`/imoveis?aba=${a.id}`}
            className={`flex h-11 items-center justify-center border-b-2 text-[13px] ${
              aba === a.id ? "border-navy font-extrabold text-navy" : "border-transparent font-semibold text-suave"
            }`}
          >
            {a.nome}
          </Link>
        ))}
      </div>
      <main className="mx-auto flex max-w-3xl flex-col gap-3.5 px-4 pt-4">
        {aba === "lancamento" ? <Lancamentos construtora={construtora} /> : <ListaImoveis finalidade={aba} />}
      </main>
    </div>
  );

  async function Lancamentos({ construtora }: { construtora?: string }) {
    const [{ data: construtoras }, { data: emps }, { data: negocios }] = await Promise.all([
      supabase.from("construtoras").select("id, nome").order("nome"),
      supabase
        .from("empreendimentos")
        .select("id, nome, bairro, status_obra, preco_min, site_slug, construtora_id, construtoras(nome), tipologias(nome, area_m2, suites, quartos, preco_a_partir)")
        .eq("ativo", true)
        .order("nome"),
      supabase.from("negocios").select("empreendimento_id").not("empreendimento_id", "is", null).not("etapa", "in", "(fechado,perdido)"),
    ]);
    const leadsPor = new Map<string, number>();
    (negocios ?? []).forEach((n) => leadsPor.set(n.empreendimento_id, (leadsPor.get(n.empreendimento_id) ?? 0) + 1));
    const lista = (emps ?? []).filter((e) => !construtora || e.construtora_id === construtora);

    return (
      <>
        <div className="flex flex-wrap gap-2">
          <Chip href="/imoveis?aba=lancamento" ativo={!construtora}>Todas</Chip>
          {(construtoras ?? []).map((c) => (
            <Chip key={c.id} href={`/imoveis?aba=lancamento&c=${c.id}`} ativo={construtora === c.id}>
              {c.nome}
            </Chip>
          ))}
        </div>
        {lista.length === 0 && <Vazio texto="Nenhum lançamento desta construtora ainda." />}
        {lista.map((e) => {
          const tips = (e.tipologias ?? []) as Tipologia[];
          const leads = leadsPor.get(e.id) ?? 0;
          const cons = e.construtoras as unknown as { nome: string } | null;
          return (
            <article key={e.id} className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(11,37,69,0.08)]">
              <div className="relative flex h-36 items-center justify-center bg-[#DCE4EF] text-[13px] font-semibold text-suave">
                Render da construtora
                {e.status_obra && (
                  <span className="absolute left-3 top-3 rounded-lg bg-navy px-2 py-1 text-[11px] font-bold text-white">
                    {e.status_obra === "em_obra" ? "Em obra" : e.status_obra === "na_planta" ? "Na planta" : "Pronto"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <span className="text-xs font-semibold text-suave">{[cons?.nome, e.bairro].filter(Boolean).join(" · ")}</span>
                <h2 className="text-lg font-extrabold">{e.nome}</h2>
                <span className="text-sm">
                  {tips.length ? tips.map((t) => `${t.nome}${t.area_m2 ? ` ${Number(t.area_m2)} m²` : ""}`).join(" · ") : "Tipologias a cadastrar"}
                </span>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[15px] font-extrabold text-navy">
                    {e.preco_min ? `A partir de ${brl(e.preco_min)}` : "Tabela a anexar"}
                  </span>
                  {leads > 0 && <Selo tom="quente">{leads} lead{leads > 1 ? "s" : ""} em aberto</Selo>}
                </div>
                {e.site_slug && <span className="text-xs text-suave">Landing conectada: {e.site_slug}</span>}
              </div>
            </article>
          );
        })}
      </>
    );
  }

  async function ListaImoveis({ finalidade }: { finalidade: string }) {
    const { data } = await supabase
      .from("imoveis")
      .select("id, titulo, tipo, bairro, preco, area_m2, quartos, suites, exclusividade, autorizacao_venda, status")
      .eq("finalidade", finalidade)
      .order("criado_em", { ascending: false });
    if (!data || data.length === 0)
      return <Vazio texto="Nenhum imóvel cadastrado nesta aba." acao={{ href: "/imoveis/novo", rotulo: "Cadastrar imóvel" }} />;
    return (
      <>
        {data.map((i) => (
          <article key={i.id} className="flex gap-3 rounded-2xl bg-white p-3">
            <div className="h-20 w-20 shrink-0 rounded-xl bg-[#DCE4EF]" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <span className="text-xs font-semibold text-suave">{i.tipo} · {i.bairro}</span>
              <h2 className="truncate text-[15px] font-extrabold">{i.titulo ?? `${i.tipo} em ${i.bairro}`}</h2>
              <span className="text-[13px] text-suave">
                {[i.area_m2 && `${Number(i.area_m2)} m²`, i.quartos && `${i.quartos} dorm.`, i.suites && `${i.suites} suítes`].filter(Boolean).join(" · ")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-navy">{brl(i.preco)}</span>
                {i.exclusividade && <Selo tom="azul">Exclusivo</Selo>}
                {!i.autorizacao_venda && finalidade === "venda" && <Selo tom="quente">Sem autorização</Selo>}
              </div>
            </div>
          </article>
        ))}
      </>
    );
  }
}
