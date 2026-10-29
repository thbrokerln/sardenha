"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado" | "erro">("livre");
  const [erro, setErro] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErro(error.message);
      setEstado("erro");
    } else {
      setEstado("enviado");
    }
  }

  return (
    <main className="min-h-dvh bg-navy text-white flex flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.12em] opacity-80">GRUPO TH IMÓVEIS</span>
          <h1 className="text-3xl font-extrabold">Entrar no CRM</h1>
          <p className="text-sm opacity-85">Você recebe um link de acesso no seu e-mail.</p>
        </div>

        {estado === "enviado" ? (
          <div className="rounded-2xl bg-white/10 p-5 text-sm leading-relaxed">
            Link enviado para <b>{email}</b>. Abra o e-mail neste mesmo aparelho e toque no link para entrar.
          </div>
        ) : (
          <form onSubmit={entrar} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-semibold">
              E-mail
            </label>
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
            <button
              type="submit"
              disabled={estado === "enviando"}
              className="h-12 rounded-xl bg-white font-bold text-navy disabled:opacity-60"
            >
              {estado === "enviando" ? "Enviando..." : "Receber link de acesso"}
            </button>
            {estado === "erro" && <p className="text-sm text-amber-200">Não foi possível enviar: {erro}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
