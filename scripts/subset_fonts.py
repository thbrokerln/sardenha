"""Reduz as fontes ao conjunto de caracteres que a pagina realmente usa.

A Fraunces variavel com o latin inteiro pesa ~66 KB, mas ela so aparece em
titulos e numeros — algumas dezenas de glifos. O subset corta a maior parte
disso sem mudar nada visivel.

Le os caracteres do index.html e dos textos gerados em JS (precos, meses,
mensagens), para nao quebrar um glifo que so aparece depois do carregamento.

Requer: fonttools brotli
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
Uso:
    .venv/bin/python scripts/subset_fonts.py
"""
import os
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTES = os.path.join(RAIZ, "public", "fonts")

# Glifos que so aparecem em texto montado pelo JS e nao estao no HTML.
# Se algum sumir da tela, provavelmente falta um caractere aqui.
EXTRA = (
    "0123456789"
    "R$.,%–—·°ºª"
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ"
    " !?()[]{}:;/\\|+-*=<>\"'@#&_"
    " ‘’“”…→✓✔✗"
    # meses e rotulos gerados em runtime
    "janeirofevereomarçbldjuysthnvzGA"
)


def caracteres_do_html() -> set:
    html = open(os.path.join(RAIZ, "index.html"), encoding="utf-8").read()
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<(script|style)\b.*?</\1>", " ", html, flags=re.S | re.I)
    texto = re.sub(r"<[^>]+>", " ", html)
    return set(texto)


def subset(nome: str, chars: set) -> None:
    entrada = os.path.join(FONTES, f"{nome}.woff2")
    if not os.path.exists(entrada):
        print(f"  ! {nome}.woff2 nao encontrado — rode scripts/fetch_fonts.py antes")
        return

    antes = os.path.getsize(entrada)
    saida = os.path.join(FONTES, f"{nome}.subset.woff2")
    texto = "".join(sorted(chars))

    cmd = [
        sys.executable, "-m", "fontTools.subset", entrada,
        f"--text={texto}",
        f"--output-file={saida}",
        "--flavor=woff2",
        "--layout-features=kern,liga,calt,tnum,onum,frac",
        # preserva os eixos variaveis: e o que da os pesos 300..500
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=*",
        "--drop-tables+=DSIG",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ! falha no subset de {nome}:\n{r.stderr[:400]}")
        return

    depois = os.path.getsize(saida)
    os.replace(saida, entrada)
    print(f"  {nome:10s} {antes/1024:6.1f} KB -> {depois/1024:6.1f} KB  "
          f"({100 - depois*100/antes:.0f}% menor)")


def main():
    chars = caracteres_do_html() | set(EXTRA)
    print(f"{len(chars)} caracteres distintos em uso\n")
    for nome in ("fraunces", "manrope"):
        subset(nome, chars)
    print("\nSe algum caractere sumir da tela, acrescente em EXTRA e rode de novo.")
    print("Para voltar ao alfabeto completo: python3 scripts/fetch_fonts.py")


if __name__ == "__main__":
    main()
