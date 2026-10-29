# TH CRM

CRM do Grupo TH Imóveis (fase 1). Next.js 15 + Supabase + Vercel, pensado para o celular.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Nome | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vcvgbslltyukbbruhfjb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave publicável do Supabase (`sb_publishable_...`) |
| `CRON_SECRET` | opcional; protege a rota diária `/api/cron/keepalive` |

O app usa só a chave publicável: toda a segurança está nas regras RLS do banco (só quem está na tabela `equipe` vê os dados). A chave secreta (`service_role`) não é usada nesta fase.

## Login

Link mágico no e-mail. O primeiro login com `thbrokerln@gmail.com` entra automaticamente na equipe.
No Supabase, em Authentication → URL Configuration, cadastre o domínio do app em *Site URL* e `https://SEU-DOMINIO/**` em *Redirect URLs*.

## Supabase grátis sem hibernar

`vercel.json` agenda uma consulta leve diária em `/api/cron/keepalive`.

## Banco

As migrações em `supabase/migrations/` já estão aplicadas no projeto.

## Rodar local

```bash
cp .env.example .env.local   # preencha as chaves
npm install
npm run dev
```
