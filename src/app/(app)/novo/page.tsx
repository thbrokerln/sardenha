import { createClient } from "@/lib/supabase/server";
import { Cabecalho } from "@/components/ui";
import { Aviso, Campo, Escolha } from "@/components/campos";
import { OBJETIVOS, ORIGENS } from "@/lib/format";
import { criarLead } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoLeadPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const supabase = await createClient();
  const { data: emps } = await supabase.from("empreendimentos").select("id, nome").eq("ativo", true).order("nome");

  return (
    <div>
      <Cabecalho titulo="Novo lead" sub="Só nome, telefone e origem são obrigatórios." />
      <form action={criarLead} className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4">
        <Aviso erro={erro} />
        <Campo nome="nome" rotulo="Nome" obrigatorio />
        <Campo nome="telefone" rotulo="WhatsApp com DDD" obrigatorio tipo="tel" modo="tel" dica="12 99999-0000" />
        <Escolha nome="origem" rotulo="Origem" obrigatorio opcoes={Object.entries(ORIGENS).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <Escolha nome="objetivo" rotulo="Objetivo" opcoes={Object.entries(OBJETIVOS).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <Escolha nome="empreendimento_id" rotulo="Interesse em lançamento" opcoes={(emps ?? []).map((e) => ({ valor: e.id, rotulo: e.nome }))} />
        <Escolha
          nome="faixa_renda"
          rotulo="Faixa de renda"
          opcoes={["até 10k", "10-15k", "15-25k", "25-50k", "acima de 50k"].map((v) => ({ valor: v, rotulo: `R$ ${v}` }))}
        />
        <Escolha
          nome="forma_pagamento"
          rotulo="Forma de pagamento"
          opcoes={[
            { valor: "a_vista", rotulo: "À vista" },
            { valor: "financiamento", rotulo: "Financiamento" },
            { valor: "permuta", rotulo: "Permuta" },
            { valor: "misto", rotulo: "Misto" },
          ]}
        />
        <Escolha nome="usa_fgts" rotulo="Usa FGTS" opcoes={[{ valor: "sim", rotulo: "Sim" }, { valor: "nao", rotulo: "Não" }]} />
        <Campo nome="preco_max" rotulo="Até quanto quer investir (R$)" modo="decimal" />
        <Campo nome="bairros" rotulo="Bairros de interesse" dica="Massaguaçu, Martim de Sá" />
        <Campo nome="email" rotulo="E-mail" tipo="email" modo="email" />
        <div className="flex flex-col gap-1">
          <label htmlFor="observacoes" className="text-[13px] font-semibold">Observações</label>
          <textarea id="observacoes" name="observacoes" rows={3} className="rounded-xl border border-[#C9D2DE] p-3 text-[15px]" />
        </div>
        <p className="text-xs text-suave">Ao salvar, o CRM registra que o cliente aceitou receber contato por este canal (LGPD).</p>
        <button className="mt-1 h-12 rounded-xl bg-navy font-bold text-white">Salvar lead</button>
      </form>
    </div>
  );
}
