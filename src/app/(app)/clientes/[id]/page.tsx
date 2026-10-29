import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cartao, Selo } from "@/components/ui";
import { brl, dataCurta, iniciais, nomeEtapa, OBJETIVOS, ORIGENS } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGAMENTO: Record<string, string> = { a_vista: "À vista", financiamento: "Financiamento", permuta: "Permuta", misto: "Misto" };

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: c }, { data: negocios }, { data: mensagens }, { data: visitas }, { data: docs }, { data: matches }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("negocios").select("id, etapa, valor, criado_em, empreendimentos(nome), imoveis(titulo, bairro)").eq("cliente_id", id).order("criado_em", { ascending: false }),
    supabase.from("mensagens").select("id, texto, direcao, canal, criado_em").eq("cliente_id", id).order("criado_em", { ascending: false }).limit(10),
    supabase.from("visitas").select("id, inicio, status").eq("cliente_id", id).order("inicio", { ascending: false }).limit(10),
    supabase.from("v_documentos_status").select("id, tipo, status").eq("cliente_id", id),
    supabase.from("matches").select("id, score, status, imoveis(titulo, bairro, preco), tipologias(nome, empreendimentos(nome))").eq("cliente_id", id).order("score", { ascending: false }).limit(5),
  ]);
  if (!c) notFound();

  const tel = String(c.telefone ?? "").replace(/\D/g, "");
  const wa = `https://wa.me/${tel.length <= 11 ? "55" + tel : tel}`;

  const historico = [
    ...(mensagens ?? []).map((m) => ({ d: m.criado_em as string, t: `${m.direcao === "entrada" ? "Mensagem recebida" : "Mensagem enviada"}: ${String(m.texto ?? "").slice(0, 80)}` })),
    ...(visitas ?? []).map((v) => ({ d: v.inicio as string, t: `Visita ${v.status}` })),
    ...(negocios ?? []).map((n) => {
      const e = n.empreendimentos as unknown as { nome: string } | null;
      return { d: n.criado_em as string, t: `Negócio aberto${e ? ` · ${e.nome}` : ""}` };
    }),
  ].sort((a, b) => (a.d < b.d ? 1 : -1));

  const perfil: [string, string][] = [
    ["Objetivo", c.objetivo ? OBJETIVOS[c.objetivo] : "—"],
    ["Faixa de renda", c.faixa_renda ? `R$ ${c.faixa_renda}` : "—"],
    ["Pagamento", c.forma_pagamento ? PAGAMENTO[c.forma_pagamento] ?? c.forma_pagamento : "—"],
    ["Usa FGTS", c.usa_fgts === null ? "—" : c.usa_fgts ? "Sim" : "Não"],
    ["Até", brl(c.preco_max)],
    ["Credibilidade", c.credibilidade ?? "—"],
  ];

  return (
    <div>
      <header className="bg-navy px-5 pb-5 pt-10 text-white md:pt-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <Link href="/clientes" className="text-sm opacity-85">← Clientes</Link>
          <div className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-extrabold text-navy">{iniciais(c.nome)}</span>
            <div>
              <h1 className="text-[22px] font-extrabold">{c.nome}</h1>
              <span className="text-[13px] opacity-85">{ORIGENS[c.origem]} · desde {dataCurta(c.criado_em)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl bg-white/15 text-[13px] font-bold">
              Chamar no WhatsApp
            </a>
            <a href={`tel:+55${tel}`} className="flex h-11 items-center justify-center rounded-xl bg-white/15 text-[13px] font-bold">Ligar</a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4">
        <Cartao>
          <h2 className="mb-2.5 text-[15px] font-bold">Perfil</h2>
          <dl className="grid grid-cols-2 gap-3">
            {perfil.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-suave">{k}</dt>
                <dd className="text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {c.observacoes && <p className="mt-3 border-t border-[#EEF1F5] pt-3 text-[13px] text-suave">{c.observacoes}</p>}
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold">Negócios</h2>
          {(negocios ?? []).map((n) => {
            const e = n.empreendimentos as unknown as { nome: string } | null;
            const i = n.imoveis as unknown as { titulo: string | null; bairro: string } | null;
            return (
              <Link key={n.id} href={`/negocios?etapa=${n.etapa}`} className="flex items-center justify-between gap-2">
                <span className="text-sm">{e?.nome ?? i?.titulo ?? i?.bairro ?? "Imóvel a definir"} · {brl(n.valor)}</span>
                <Selo tom="azul">{nomeEtapa(n.etapa)}</Selo>
              </Link>
            );
          })}
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold">Imóveis compatíveis</h2>
          {(matches ?? []).length === 0 ? (
            <p className="text-sm text-suave">O match automático entra na próxima etapa.</p>
          ) : (
            matches!.map((m) => {
              const i = m.imoveis as unknown as { titulo: string | null; bairro: string; preco: number } | null;
              const t = m.tipologias as unknown as { nome: string; empreendimentos: { nome: string } | null } | null;
              return (
                <div key={m.id} className="flex justify-between text-sm">
                  <span>{t ? `${t.empreendimentos?.nome} · ${t.nome}` : `${i?.titulo ?? i?.bairro} · ${brl(i?.preco)}`}</span>
                  <span className="font-bold text-navy-2">{m.score}%</span>
                </div>
              );
            })
          )}
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold">Histórico</h2>
          {historico.length === 0 && <p className="text-sm text-suave">Sem registros ainda.</p>}
          {historico.map((h, k) => (
            <div key={k} className="flex gap-2.5">
              <span className="w-11 shrink-0 text-xs text-suave">{dataCurta(h.d)}</span>
              <span className="text-[13px]">{h.t}</span>
            </div>
          ))}
        </Cartao>

        <Cartao className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold">Documentos</h2>
            <span className="text-xs text-suave">Arquivo privado · só você acessa</span>
          </div>
          <span className="text-[13px] font-bold text-quente">
            {(docs ?? []).filter((d) => d.status === "pendente").length} pendente(s)
          </span>
        </Cartao>
      </main>
    </div>
  );
}
