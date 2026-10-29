import { Cabecalho } from "@/components/ui";
import { Aviso, Campo, Escolha } from "@/components/campos";
import { criarImovel } from "../../actions";

export default async function NovoImovelPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div>
      <Cabecalho titulo="Novo imóvel" sub="IPTU e matrícula podem ficar para depois." />
      <form action={criarImovel} className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4">
        <Aviso erro={erro} />
        <Escolha
          nome="finalidade"
          rotulo="Finalidade"
          obrigatorio
          opcoes={[
            { valor: "venda", rotulo: "Venda" },
            { valor: "locacao", rotulo: "Locação" },
            { valor: "temporada", rotulo: "Temporada (indicação)" },
          ]}
        />
        <Escolha
          nome="tipo"
          rotulo="Tipo"
          obrigatorio
          opcoes={["Casa", "Apartamento", "Studio", "Terreno", "Comercial"].map((t) => ({ valor: t, rotulo: t }))}
        />
        <Campo nome="titulo" rotulo="Título do anúncio" dica="Casa 3 suítes pé na areia" />
        <Campo nome="bairro" rotulo="Bairro" obrigatorio dica="Massaguaçu" />
        <Campo nome="endereco" rotulo="Rua e número" />
        <Campo nome="preco" rotulo="Preço (R$)" obrigatorio modo="decimal" dica="850000" />
        <div className="grid grid-cols-2 gap-3">
          <Campo nome="area_m2" rotulo="Área (m²)" modo="decimal" />
          <Campo nome="quartos" rotulo="Dormitórios" modo="numeric" />
          <Campo nome="suites" rotulo="Suítes" modo="numeric" />
          <Campo nome="vagas" rotulo="Vagas" modo="numeric" />
          <Campo nome="condominio" rotulo="Condomínio (R$)" modo="decimal" />
          <Campo nome="iptu" rotulo="IPTU (R$/ano)" modo="decimal" />
        </div>
        <Campo nome="matricula" rotulo="Matrícula" />
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="autorizacao_venda" className="h-5 w-5" /> Tenho autorização de venda
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="exclusividade" className="h-5 w-5" /> Exclusividade
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="descricao" className="text-[13px] font-semibold">Descrição</label>
          <textarea id="descricao" name="descricao" rows={4} className="rounded-xl border border-[#C9D2DE] p-3 text-[15px]" />
        </div>
        <button className="mt-2 h-12 rounded-xl bg-navy font-bold text-white">Salvar imóvel</button>
      </form>
    </div>
  );
}
