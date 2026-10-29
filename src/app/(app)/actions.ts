"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { soNumeros } from "@/lib/format";

export async function responderDecisao(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["aprovada", "ajustada", "recusada"].includes(status)) return;
  const supabase = await createClient();
  await supabase
    .from("decisoes_ceo")
    .update({ status, respondido_em: new Date().toISOString() })
    .eq("id", id);
  await supabase.from("agentes_log").insert({ agente: "thiago", acao: `decisao_${status}`, entidade: "decisoes_ceo", entidade_id: id });
  revalidatePath("/");
}

export async function mudarEtapa(formData: FormData) {
  const id = String(formData.get("id"));
  const etapa = String(formData.get("etapa"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  const supabase = await createClient();
  const dados: Record<string, unknown> = { etapa };
  if (etapa === "perdido") dados.motivo_perda = motivo || "Não informado";
  if (etapa === "fechado") dados.fechado_em = new Date().toISOString().slice(0, 10);
  await supabase.from("negocios").update(dados).eq("id", id);
  await supabase.from("agentes_log").insert({
    agente: "thiago",
    acao: "mudou_etapa",
    entidade: "negocios",
    entidade_id: id,
    dados: { etapa, motivo: motivo || null },
  });
  revalidatePath("/negocios");
  revalidatePath("/");
}

export async function criarLead(formData: FormData) {
  const supabase = await createClient();
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = soNumeros(String(formData.get("telefone") ?? ""));
  const origem = String(formData.get("origem") ?? "whatsapp");
  if (nome.length < 2 || telefone.length < 10) redirect("/novo?erro=dados");

  const num = (k: string) => {
    const v = String(formData.get(k) ?? "").replace(/\./g, "").replace(",", ".").trim();
    return v ? Number(v) : null;
  };
  const texto = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };

  const { data: existente } = await supabase.from("clientes").select("id").eq("telefone", telefone).maybeSingle();
  let clienteId = existente?.id as string | undefined;

  if (!clienteId) {
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome,
        telefone,
        origem,
        email: texto("email"),
        objetivo: texto("objetivo"),
        faixa_renda: texto("faixa_renda"),
        forma_pagamento: texto("forma_pagamento"),
        usa_fgts: formData.get("usa_fgts") === "sim" ? true : formData.get("usa_fgts") === "nao" ? false : null,
        preco_max: num("preco_max"),
        bairros: texto("bairros")?.split(",").map((b) => b.trim()).filter(Boolean) ?? [],
        observacoes: texto("observacoes"),
        consentimento_em: new Date().toISOString(),
        consentimento_canal: origem,
      })
      .select("id")
      .single();
    if (error || !data) redirect("/novo?erro=salvar");
    clienteId = data.id as string;
  }

  await supabase.from("negocios").insert({
    cliente_id: clienteId,
    empreendimento_id: texto("empreendimento_id"),
    etapa: "lead",
  });
  revalidatePath("/");
  revalidatePath("/negocios");
  redirect(`/clientes/${clienteId}`);
}

export async function criarImovel(formData: FormData) {
  const supabase = await createClient();
  const texto = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };
  const num = (k: string) => {
    const v = String(formData.get(k) ?? "").replace(/\./g, "").replace(",", ".").trim();
    return v ? Number(v) : null;
  };
  const finalidade = texto("finalidade");
  const tipo = texto("tipo");
  const bairro = texto("bairro");
  const preco = num("preco");
  if (!finalidade || !tipo || !bairro || preco === null) redirect("/imoveis/novo?erro=dados");

  const { error } = await supabase.from("imoveis").insert({
    finalidade,
    tipo,
    bairro,
    preco,
    titulo: texto("titulo"),
    endereco: texto("endereco"),
    area_m2: num("area_m2"),
    quartos: num("quartos"),
    suites: num("suites"),
    vagas: num("vagas"),
    condominio: num("condominio"),
    iptu: num("iptu"),
    matricula: texto("matricula"),
    autorizacao_venda: formData.get("autorizacao_venda") === "on",
    exclusividade: formData.get("exclusividade") === "on",
    descricao: texto("descricao"),
  });
  if (error) redirect("/imoveis/novo?erro=salvar");
  revalidatePath("/imoveis");
  redirect(`/imoveis?aba=${finalidade}`);
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
