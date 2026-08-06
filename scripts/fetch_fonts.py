"""Baixa Fraunces e Manrope do Google Fonts para auto-hospedagem.

Servir do Google custa duas conexoes extras (googleapis + gstatic) e uma cadeia
de dependencia bloqueante antes do primeiro texto pintar. Hospedando local, a
fonte sai do mesmo host do HTML e entra no preload direto.

Uso: python scripts/fetch_fonts.py
"""
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")

# um Chrome recente para o Google devolver woff2 variavel
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

FAMILIES = {
    "fraunces": "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..500&display=swap",
    "manrope": "https://fonts.googleapis.com/css2?family=Manrope:wght@400..700&display=swap",
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    faces = []

    for name, url in FAMILIES.items():
        css = get(url).decode("utf-8")
        # so o bloco latin (sem latin-ext/vietnamese) — e o que a pagina usa
        blocks = re.findall(r"/\*\s*([\w\-\[\]]+)\s*\*/\s*(@font-face\s*\{[^}]+\})", css)
        chosen = [b for label, b in blocks if label == "latin"] or [b for _, b in blocks]
        for block in chosen[:1]:
            src = re.search(r"url\((https://[^)]+\.woff2)\)", block)
            rng = re.search(r"unicode-range:\s*([^;]+);", block)
            style = re.search(r"font-style:\s*(\w+)", block)
            weight = re.search(r"font-weight:\s*([^;]+);", block)
            if not src:
                continue
            data = get(src.group(1))
            fname = f"{name}.woff2"
            with open(os.path.join(OUT, fname), "wb") as fh:
                fh.write(data)
            faces.append({
                "family": "Fraunces" if name == "fraunces" else "Manrope",
                "file": fname,
                "weight": (weight.group(1).strip() if weight else "400"),
                "style": (style.group(1) if style else "normal"),
                "range": (rng.group(1).strip() if rng else None),
                "kb": len(data) // 1024,
            })
            print(f"  {fname:16s} {len(data) // 1024} KB  peso {faces[-1]['weight']}")

    css_out = ["/* Gerado por scripts/fetch_fonts.py — nao editar a mao */"]
    for f in faces:
        css_out.append(
            "@font-face {\n"
            f"  font-family: '{f['family']}';\n"
            f"  font-style: {f['style']};\n"
            f"  font-weight: {f['weight']};\n"
            "  font-display: swap;\n"
            f"  src: url('/fonts/{f['file']}') format('woff2');\n"
            + (f"  unicode-range: {f['range']};\n" if f["range"] else "")
            + "}"
        )
    path = os.path.join(ROOT, "src", "styles", "fonts.css")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(css_out) + "\n")
    print(f"\n{len(faces)} faces -> {path}")


if __name__ == "__main__":
    main()
