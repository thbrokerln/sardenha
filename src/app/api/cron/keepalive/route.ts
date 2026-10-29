import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Roda 1x por dia (vercel.json) para o Supabase grátis não hibernar por falta de uso.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { count, error } = await supabase
    .from("projetos")
    .select("slug", { count: "exact", head: true });

  return NextResponse.json({ ok: !error, projetos: count ?? 0, em: new Date().toISOString() });
}
