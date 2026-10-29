export function brl(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = Number(valor);
  if (Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (n >= 10_000) return `R$ ${Math.round(n / 1000).toLocaleString("pt-BR")} mil`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

export function hora(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

export function iniciais(nome: string | null | undefined): string {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function soNumeros(tel: string): string {
  return tel.replace(/\D/g, "");
}

export const ETAPAS = [
  { id: "lead", nome: "Lead" },
  { id: "qualificado", nome: "Qualificado" },
  { id: "visita_agendada", nome: "Visita agendada" },
  { id: "visita_realizada", nome: "Visita realizada" },
  { id: "proposta", nome: "Proposta" },
  { id: "negociacao", nome: "Negociação" },
  { id: "documentacao", nome: "Documentação" },
  { id: "fechado", nome: "Fechado" },
  { id: "perdido", nome: "Perdido" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["id"];

export function nomeEtapa(id: string): string {
  return ETAPAS.find((e) => e.id === id)?.nome ?? id;
}

export const OBJETIVOS: Record<string, string> = {
  morar: "Morar",
  investir: "Investir",
  airbnb: "Investir (temporada)",
  segundo_imovel: "Segundo imóvel",
  primeiro_imovel: "Primeiro imóvel",
  outro: "Outro",
};

export const ORIGENS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  site: "Site",
  indicacao: "Indicação",
  placa: "Placa",
  parceiro: "Parceiro",
  outro: "Outro",
};
