import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Cartao, Selo, Vazio } from "@/components/ui";
import { brl, dataCurta, hora, OBJETIVOS } from "@/lib/format";
import { responderDecisao } from "./actions";

export const dynamic = "force-dynamic";

function inicioDoDiaSP(): string {
  const agora = new Date();
  const sp = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const diff = agora.getTime() - sp.getTime();
  sp.setHours(0, 0, 0, 0);
  return new Date(sp.getTime() + diff).toISOString();
}

export default async function HojePage() {
  const supabase = await createClient();
  const hoje = inicioDoDiaSP();
  const amanha = new Date(new Date(hoje).getTime() + 86_400_000).toISOString();
  const doisDias = new Date(Date.now() - 2 * 86_400_000).toISOString();

  const [
    { data: user },
    { data: decisoes },
    { count: leadsHoje },
    { data: abertos },
    { data: comissoes },
    { data: esperando, count: totalEsperando },
    { data: visitas },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("decisoes_ceo").select("*").eq("status", "pendente").order("criado_em", { ascending: false }).limit(5),
    supabase.from("clientes").select("id", { count: "exact", head: true }).gte("criado_em", hoje),
    supabase.from("negocios").select("valor").in("etapa", ["proposta", "negociacao", "documentacao"]),
    supabase.from("comissoes").select("valor_liquido").eq("status", "prevista"),
    supabase
      .from("negocios")
      .select("id, criado_em, clientes(id, nome, objetivo), empreendimentos(nome)", { count: "exact" })
      .eq("etapa", "lead")
      .lt("criado_em", doisDias)
      .order("criado_em", { ascending: true })
      .limit(6),
    supabase
      .from("visitas")
      .select("id, inicio, clientes(nome), imoveis(titulo, bairro), empreendimentos(nome)")
      .gte("inicio", hoje)
      .lt("inicio", amanha)
      .order("inicio"),
  ]);

  const vgv = (abertos ?? []).reduce((s, n) => s + Number(n.valor ?? 0), 0);
  const aReceber = (comissoes ?? []).reduce((s, c) => s + Number(c.valor_liquido ?? 0), 0);
  const semEquipe = !user.user;

  return (
    <div>
      <header className="bg-navy px-5 pb-16 pt-12 text-white md:pt-8">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-semibold tracking-[0.12em] opacity-80">GRUPO TH IMÓVEIS</span>
          <h1 className="mt-2 text-[26px] font-extrabold">Olá, Thiago</h1>
          <p className="text-sm opacity-85">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" })}
            {" · "}
            {visitas?.length ?? 0} visita{(visitas?.length ?? 0) === 1 ? "" : "s"} hoje
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-11 flex max-w-3xl flex-col gap-3.5 px-4">
        {semEquipe && <Vazio texto="Sua sessão expirou. Entre de novo." acao={{ href: "/login", rotulo: "Entrar" }} />}

        <Cartao className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Decisões do CEO</h2>
            {(decisoes?.length ?? 0) > 0 && <Selo tom="quente">{decisoes!.length} pendente{decisoes!.length > 1 ? "s" : ""}</Selo>}
          </div>
          {(decisoes ?? []).length === 0 ? (
            <p className="text-sm text-suave">Nada esperando você. Quando os agentes estiverem ligados, as decisões aparecem aqui e no Telegram.</p>
          ) : (
            decisoes!.map((d) => (
              <div key={d.id} className="flex flex-col gap-2 rounded-xl border border-borda p-3">
                <span className="text-xs font-bold uppercase text-quente">{d.tipo}</span>
                <p className="text-sm leading-snug">{d.contexto}</p>
                {d.recomendacao && <p className="text-[13px] text-suave">Recomendação: {d.recomendacao}</p>}
                <form action={responderDecisao} className="grid grid-cols-3 gap-2">
                  <input type="hidden" name="id" value={d.id} />
                  <button name="status" value="aprovada" className="h-11 rounded-xl bg-navy text-sm font-bold text-white">Aprovar</button>
                  <button name="status" value="ajustada" className="h-11 rounded-xl border border-[#C9D2DE] text-sm font-semibold">Ajustar</button>
                  <button name="status" value="recusada" className="h-11 rounded-xl border border-[#C9D2DE] text-sm font-semibold">Recusar</button>
                </form>
              </div>
            ))
          )}
        </Cartao>

        <section aria-label="Indicadores" className="grid grid-cols-3 gap-2">
          {[
            { r: "Leads hoje", v: String(leadsHoje ?? 0) },
            { r: "Em negociação", v: brl(vgv) },
            { r: "A receber", v: brl(aReceber) },
          ].map((k) => (
            <div key={k.r} className="flex flex-col gap-1 rounded-xl bg-white p-3">
              <span className="text-[11px] font-semibold text-suave">{k.r}</span>
              <span className="text-lg font-extrabold leading-tight">{k.v}</span>
            </div>
          ))}
        </section>

        <Cartao className="flex flex-col gap-1">
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Esperando seu contato</h2>
            {(totalEsperando ?? 0) > 0 && <Selo tom="quente">{totalEsperando}</Selo>}
          </div>
          {(esperando ?? []).length === 0 ? (
            <p className="text-sm text-suave">Nenhum lead parado há mais de 2 dias.</p>
          ) : (
            esperando!.map((n) => {
              const c = n.clientes as unknown as { id: string; nome: string; objetivo: string | null } | null;
              const e = n.empreendimentos as unknown as { nome: string } | null;
              return (
                <Link key={n.id} href={`/clientes/${c?.id}`} className="flex items-center gap-3 border-b border-[#EEF1F5] py-2 last:border-0">
                  <Avatar nome={c?.nome} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{c?.nome}</span>
                    <span className="truncate text-xs text-suave">
                      {[e?.nome, c?.objetivo ? OBJETIVOS[c.objetivo] : null].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-quente">desde {dataCurta(n.criado_em)}</span>
                </Link>
              );
            })
          )}
          {(totalEsperando ?? 0) > 6 && (
            <Link href="/negocios?etapa=lead" className="pt-2 text-sm font-bold text-navy">Ver todos</Link>
          )}
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold">Visitas de hoje</h2>
          {(visitas ?? []).length === 0 ? (
            <p className="text-sm text-suave">Nenhuma visita marcada para hoje.</p>
          ) : (
            visitas!.map((v) => {
              const c = v.clientes as unknown as { nome: string } | null;
              const i = v.imoveis as unknown as { titulo: string | null; bairro: string } | null;
              const e = v.empreendimentos as unknown as { nome: string } | null;
              return (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-extrabold text-navy">{hora(v.inicio)}</span>
                  <span className="text-sm">
                    {c?.nome} · {e?.nome ?? i?.titulo ?? i?.bairro ?? "Imóvel"}
                  </span>
                </div>
              );
            })
          )}
        </Cartao>
      </main>
    </div>
  );
}
