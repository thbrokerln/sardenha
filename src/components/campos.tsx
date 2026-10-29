export function Campo({
  nome,
  rotulo,
  tipo = "text",
  obrigatorio = false,
  dica,
  modo,
}: {
  nome: string;
  rotulo: string;
  tipo?: string;
  obrigatorio?: boolean;
  dica?: string;
  modo?: "numeric" | "decimal" | "tel" | "email" | "text";
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={nome} className="text-[13px] font-semibold">
        {rotulo} {obrigatorio && <span className="text-quente">*</span>}
      </label>
      <input
        id={nome}
        name={nome}
        type={tipo}
        required={obrigatorio}
        inputMode={modo}
        placeholder={dica}
        className="h-12 rounded-xl border border-[#C9D2DE] bg-white px-3 text-[15px] outline-none focus:border-navy"
      />
    </div>
  );
}

export function Escolha({
  nome,
  rotulo,
  opcoes,
  obrigatorio = false,
}: {
  nome: string;
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  obrigatorio?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={nome} className="text-[13px] font-semibold">
        {rotulo} {obrigatorio && <span className="text-quente">*</span>}
      </label>
      <select
        id={nome}
        name={nome}
        required={obrigatorio}
        defaultValue=""
        className="h-12 rounded-xl border border-[#C9D2DE] bg-white px-3 text-[15px]"
      >
        <option value="" disabled={obrigatorio}>
          {obrigatorio ? "Escolha" : "Não informado"}
        </option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Aviso({ erro }: { erro?: string }) {
  if (!erro) return null;
  const msg = erro === "dados" ? "Confira os campos obrigatórios." : "Não foi possível salvar. Tente de novo.";
  return <p className="rounded-xl bg-quente-bg p-3 text-sm font-semibold text-quente">{msg}</p>;
}
