"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Modo = "senha" | "link";

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado" | "erro">("livre");
  const [erro, setErro] = useState("");

  function traduz(msg: string) {
    if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos. Se ainda não criou sua senha, use \"Primeiro acesso\".";
    if (/rate limit/i.test(msg)) return "Muitos e-mails enviados em pouco tempo. Espere cerca de 1 hora ou entre com sua senha.";
    if (/email not confirmed/i.test(msg)) return "E-mail ainda não confirmado. Use \"Primeiro acesso\".";
    return msg;
  }

  async function entrarComSenha(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro(traduz(error.message));
      setEstado("erro");
    } else {
      window.location.href = "/";
    }
  }

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?proximo=/conta/senha` },
    });
    if (error) {
      setErro(traduz(error.message));
      setEstado("erro");
    } else {
      setEstado("enviado");
    }
  }

  const campoEmail = (
    <>
      <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@email.com"
        className="h-12 rounded-xl bg-white px-4 text-tinta outline-none focus:ring-2 focus:ring-white/60"
      />
    </>
  );

  return (
    <main className="min-h-dvh bg-navy text-white flex flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.12em] opacity-80">GRUPO TH IMÓVEIS</span>
          <h1 className="text-3xl font-extrabold">Entrar no CRM</h1>
        </div>

        <div role="tablist" className="grid grid-cols-2 rounded-xl bg-white/10 p-1">
          {(["senha", "link"] as Modo[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => { setModo(m); setEstado("livre"); setErro(""); }}
              className={`h-10 rounded-lg text-sm font-bold ${modo === m ? "bg-white text-navy" : "text-white/85"}`}
            >
              {m === "senha" ? "Entrar com senha" : "Primeiro acesso"}
            </button>
          ))}
        </div>

        {modo === "senha" ? (
          <form onSubmit={entrarComSenha} className="flex flex-col gap-3">
            {campoEmail}
            <label htmlFor="senha" className="text-sm font-semibold">Senha</label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-12 rounded-xl bg-white px-4 text-tinta outline-none focus:ring-2 focus:ring-white/60"
            />
            <button type="submit" disabled={estado === "enviando"} className="h-12 rounded-xl bg-white font-bold text-navy disabled:opacity-60">
              {estado === "enviando" ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : estado === "enviado" ? (
          <div className="rounded-2xl bg-white/10 p-5 text-sm leading-relaxed">
            Link enviado para <b>{email}</b>. Abra o e-mail neste aparelho, toque no link e crie sua senha. Depois você entra sempre pela aba &quot;Entrar com senha&quot;.
          </div>
        ) : (
          <form onSubmit={enviarLink} className="flex flex-col gap-3">
            <p className="text-sm opacity-85">Primeira vez ou esqueceu a senha? Receba um link no e-mail para criar uma nova.</p>
            {campoEmail}
            <button type="submit" disabled={estado === "enviando"} className="h-12 rounded-xl bg-white font-bold text-navy disabled:opacity-60">
              {estado === "enviando" ? "Enviando..." : "Receber link para criar senha"}
            </button>
          </form>
        )}

        {estado === "erro" && <p className="text-sm text-amber-200">{erro}</p>}
      </div>
    </main>
  );
}
