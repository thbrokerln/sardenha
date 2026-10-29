import { createClient } from "@/lib/supabase/server";
import { Avatar, Cabecalho, Selo, Vazio } from "@/components/ui";
import { dataCurta } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProprietariosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proprietarios")
    .select("id, nome, telefone, proxima_reavaliacao, imoveis(id)")
    .order("proxima_reavaliacao", { ascending: true, nullsFirst: false });
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <Cabecalho titulo="Proprietários" sub="Reavaliação de preço a cada 90 dias" />
      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4">
        {(data ?? []).length === 0 ? (
          <Vazio texto="Nenhum proprietário cadastrado ainda. Eles entram junto com os imóveis captados." />
        ) : (
          <div className="flex flex-col rounded-2xl bg-white px-4">
            {data!.map((p) => {
              const vencida = p.proxima_reavaliacao && p.proxima_reavaliacao <= hoje;
              const qtd = (p.imoveis as unknown as { id: string }[] | null)?.length ?? 0;
              return (
                <div key={p.id} className="flex items-center gap-3 border-b border-[#EEF1F5] py-3 last:border-0">
                  <Avatar nome={p.nome} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{p.nome}</span>
                    <span className="text-xs text-suave">{qtd} imóvel(is) · reavaliar em {dataCurta(p.proxima_reavaliacao)}</span>
                  </div>
                  {vencida && <Selo tom="quente">Reavaliar</Selo>}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
