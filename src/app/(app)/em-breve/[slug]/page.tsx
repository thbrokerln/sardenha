import Link from "next/link";
import { Cabecalho } from "@/components/ui";

const TELAS: Record<string, { nome: string; texto: string }> = {
  agenda: { nome: "Agenda", texto: "Visitas e compromissos sincronizados com o seu Google Agenda." },
  documentos: { nome: "Documentos", texto: "Checklist por negócio, modelos de autorização e exclusividade e envio para assinatura no ZapSign." },
  locacao: { nome: "Locação e Administração", texto: "Contratos, vencimentos e repasses dos imóveis administrados." },
  financeiro: { nome: "Financeiro", texto: "Comissões previstas e recebidas, divisão 50/50 com parceiros e recebimentos no Inter." },
  parceiros: { nome: "Parceiros", texto: "Corretores parceiros e construtoras, com contatos e histórico de negócios." },
  conteudo: { nome: "Conteúdo", texto: "Calendário de reels por público e fila de aprovação antes de publicar." },
  trafego: { nome: "Tráfego", texto: "Campanhas da Meta, verba diária e custo por lead." },
  sites: { nome: "Sites de Lançamento", texto: "Criar e editar a página de cada lançamento, com os leads caindo direto no CRM." },
  mercado: { nome: "Mercado", texto: "Preço por m² na Zona Norte, concorrência e novos lançamentos." },
  agentes: { nome: "Agentes", texto: "Status de cada agente, regras de aprovação e o histórico do CEO." },
  relatorios: { nome: "Relatórios", texto: "Relatório semanal: leads por origem, conversão, visitas, propostas e comissões." },
  configuracoes: { nome: "Configurações", texto: "Integrações, Telegram, horários dos resumos e regras do CEO." },
};

export default async function EmBrevePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TELAS[slug] ?? { nome: "Em breve", texto: "Esta área entra nas próximas fases." };
  return (
    <div>
      <Cabecalho titulo={t.nome} sub="Em breve" />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4">
        <p className="rounded-2xl bg-white p-5 text-sm leading-relaxed text-suave">{t.texto}</p>
        <Link href="/mais" className="text-sm font-bold text-navy">← Voltar</Link>
      </main>
    </div>
  );
}
