import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Cabecalho, Selo, Vazio } from "@/components/ui";
import { dataCurta, OBJETIVOS, ORIGENS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let consulta = supabase
    .from("clientes")
    .select("id, nome, telefone, origem, objetivo, temperatura, criado_em")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (q) consulta = consulta.or(`nome.ilike.%${q.replace(/[%,()]/g, "")}%,telefone.ilike.%${q.replace(/\D/g, "") || "x"}%`);
  const { data } = await consulta;

  return (
    <div>
      <Cabecalho titulo="Clientes" sub={`${data?.length ?? 0} cadastrados`} />
      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4">
        <form className="flex gap-2">
          <label htmlFor="q" className="sr-only">Buscar</label>
          <input id="q" name="q" defaultValue={q} placeholder="Buscar por nome ou telefone" className="h-11 flex-1 rounded-xl border border-[#C9D2DE] bg-white px-3 text-sm" />
          <button className="h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white">Buscar</button>
        </form>
        {(data ?? []).length === 0 && <Vazio texto="Nenhum cliente encontrado." acao={{ href: "/novo", rotulo: "Novo lead" }} />}
        <div className="flex flex-col rounded-2xl bg-white px-4">
          {(data ?? []).map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center gap-3 border-b border-[#EEF1F5] py-3 last:border-0">
              <Avatar nome={c.nome} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{c.nome}</span>
                <span className="truncate text-xs text-suave">
                  {[ORIGENS[c.origem], c.objetivo ? OBJETIVOS[c.objetivo] : null, `desde ${dataCurta(c.criado_em)}`].filter(Boolean).join(" · ")}
                </span>
              </div>
              {c.temperatura === "quente" && <Selo tom="quente">Quente</Selo>}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
