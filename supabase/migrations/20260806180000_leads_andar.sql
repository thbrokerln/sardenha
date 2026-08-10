-- Preferencia de andar informada no formulario.
--
-- No espelho o valor sobe conforme o andar (+R$ 3.000 por andar no studio,
-- +R$ 5.000 no apartamento). Saber isso antes da primeira resposta permite
-- mandar a tabela certa em vez de perguntar.
--
-- Coluna opcional de proposito: leads gravados antes desta migration
-- continuam validos com o campo nulo.

alter table public.leads
  add column if not exists andar text;

comment on column public.leads.andar is
  'Preferencia de andar: vista (alto), preco (baixo) ou indiferente.';
