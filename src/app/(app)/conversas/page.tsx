import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Cabecalho, Chip, Selo, Vazio } from "@/components/ui";
import { dataCurta, hora, ORIGENS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConversasPage({ searchParams }: { searchParams: Promise<{ canal?: string }> }) {
  const { canal } = await searchParams;
  const supabase = await createClient();
  let consulta = supabase
    .from("mensagens")
    .select("id, cliente_id, canal, direcao, autor, texto, status, criado_em, clientes(nome, telefone)")
    .order("criado_em", { ascending: false })
    .limit(300);
  if (canal) consulta = consulta.eq("canal", canal);
  const { data } = await consulta;

  // Última mensagem por cliente
  const vistos = new Set<string>();
  const conversas = (data ?? []).filter((m) => {
    if (!m.cliente_id || vistos.has(m.cliente_id)) return false;
    vistos.add(m.cliente_id);
    return true;
  });

  return (
    <div>
      <Cabecalho titulo="Conversas" />
      <div className="border-b border-borda bg-white px-4 pb-3">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto">
          <Chip href="/conversas" ativo={!canal}>Todas</Chip>
          <Chip href="/conversas?canal=whatsapp" ativo={canal === "whatsapp"}>WhatsApp</Chip>
          <Chip href="/conversas?canal=instagram" ativo={canal === "instagram"}>Instagram</Chip>
          <Chip href="/conversas?canal=site" ativo={canal === "site"}>Site</Chip>
        </div>
      </div>
      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4">
        {conversas.length === 0 ? (
          <Vazio texto="As conversas do WhatsApp e do Instagram aparecem aqui quando o agente de atendimento for conectado à Meta. Enquanto isso, os leads das landings estão em Negócios." />
        ) : (
          <div className="flex flex-col rounded-2xl bg-white px-4">
            {conversas.map((m) => {
              const c = m.clientes as unknown as { nome: string; telefone: string } | null;
              const hojeMsg = dataCurta(m.criado_em) === dataCurta(new Date().toISOString());
              return (
                <Link key={m.id} href={`/clientes/${m.cliente_id}`} className="flex items-center gap-3 border-b border-[#EEF1F5] py-3.5 last:border-0">
                  <Avatar nome={c?.nome} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-[15px] font-bold">{c?.nome}</span>
                      <span className="shrink-0 text-xs text-suave">{hojeMsg ? hora(m.criado_em) : dataCurta(m.criado_em)}</span>
                    </div>
                    <span className="truncate text-[13px] text-suave">{ORIGENS[m.canal]} · {m.texto}</span>
                  </div>
                  {m.status === "aguardando_aprovacao" && <Selo tom="quente">Aprovar</Selo>}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
