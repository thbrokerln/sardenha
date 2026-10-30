"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Cabecalho } from "@/components/ui";

export default function SenhaPage() {
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [estado, setEstado] = useState<"livre" | "salvando" | "ok" | "erro">("livre");
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) { setErro("Use pelo menos 8 caracteres."); setEstado("erro"); return; }
    if (senha !== confirma) { setErro("As duas senhas não são iguais."); setEstado("erro"); return; }
    setEstado("salvando");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(/same/i.test(error.message) ? "Essa já é a sua senha atual." : error.message);
      setEstado("erro");
    } else {
      setEstado("ok");
    }
  }

  return (
    <div>
      <Cabecalho titulo="Minha senha" sub="Com senha, você entra sem esperar e-mail." />
      <main className="mx-auto flex max-w-md flex-col gap-3 px-4 pt-4">
        {estado === "ok" ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 text-sm">
            <p className="font-semibold text-ok">Senha salva.</p>
            <p className="text-suave">Da próxima vez, entre pela aba &quot;Entrar com senha&quot;. Se o navegador oferecer, deixe ele guardar a senha.</p>
            <Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-navy font-bold text-white">Ir para o Hoje</Link>
          </div>
        ) : (
          <form onSubmit={salvar} className="flex flex-col gap-3 rounded-2xl bg-white p-5">
            <input type="email" autoComplete="username" hidden readOnly />
            <label htmlFor="senha" className="text-[13px] font-semibold">Nova senha</label>
            <input id="senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)}
              className="h-12 rounded-xl border border-[#C9D2DE] px-3 text-[15px]" />
            <label htmlFor="confirma" className="text-[13px] font-semibold">Repita a senha</label>
            <input id="confirma" type="password" autoComplete="new-password" required value={confirma} onChange={(e) => setConfirma(e.target.value)}
              className="h-12 rounded-xl border border-[#C9D2DE] px-3 text-[15px]" />
            <p className="text-xs text-suave">Mínimo de 8 caracteres.</p>
            {estado === "erro" && <p className="text-sm font-semibold text-quente">{erro}</p>}
            <button disabled={estado === "salvando"} className="h-12 rounded-xl bg-navy font-bold text-white disabled:opacity-60">
              {estado === "salvando" ? "Salvando..." : "Salvar senha"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
