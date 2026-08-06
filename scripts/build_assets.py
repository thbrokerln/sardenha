"""Extrai e otimiza os renders do book para a landing.

Gera AVIF + WebP em larguras responsivas e um JPEG de fallback por imagem.
Recortes sobre fundo preto (plantas e fachadas) viram alpha e sao cropados
na bounding box do alpha, senao entram na pagina com uma moldura enorme de
transparencia e parecem pequenos demais dentro da secao.

Requer: pillow  (python3 -m venv .venv && .venv/bin/pip install pillow)
Uso:    python scripts/build_assets.py CAMINHO_DO_BOOK.pdf
"""
import os
import sys

from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "media")
SRC = os.environ.get("SARDENHA_EXTRACT", "/private/tmp/sardenha-extract")

# cores de fundo reais das secoes onde cada recorte aparece
SEA = (189, 198, 199)    # --sea, secao "O empreendimento"
WHITE = (255, 255, 255)  # cartao branco das plantas

# nome -> (arquivo extraido, modo)
# "photo"  = foto normal
# "flat:R,G,B" = render sobre fundo preto, composto sobre essa cor exata.
#   Recortar em alpha aqui produz serrilhado: a borda do predio contra o preto
#   esta cheia de artefato de JPEG. Como a imagem so aparece sobre um fundo
#   conhecido, compor nele resolve sem matte e sem franja.
MAP = {
    "hero-aerea":          ("p03_x97.jpeg",  "photo"),
    "mapa-satelite":       ("p02_x79.jpeg",  "photo"),
    "fachada-torres":      ("p05_x139.jpeg", f"flat:{SEA[0]},{SEA[1]},{SEA[2]}"),
    "fachada-frontal":     ("p25_x443.jpeg", f"flat:{SEA[0]},{SEA[1]},{SEA[2]}"),
    "fachada-close":       ("p01_x44.jpeg",  "photo"),
    "implantacao":         ("p24_x423.jpeg", f"flat:{WHITE[0]},{WHITE[1]},{WHITE[2]}"),
    "torre-pavimento":     ("p27_x482.jpeg", f"flat:{WHITE[0]},{WHITE[1]},{WHITE[2]}"),
    "lazer-piscina":       ("p16_x334.jpeg", "photo"),
    "lazer-cinema":        ("p13_x298.jpeg", "photo"),
    "lazer-academia":      ("p09_x257.jpeg", "photo"),
    "lazer-coworking":     ("p18_x352.jpeg", "photo"),
    "lazer-ofuro":         ("p10_x267.jpeg", "photo"),
    "lazer-festas":        ("p15_x321.jpeg", "photo"),
    "lazer-lounge":        ("p17_x343.jpeg", "photo"),
    "lazer-beauty":        ("p11_x280.jpeg", "photo"),
    "lazer-jogos":         ("p12_x285.jpeg", "photo"),
    "lazer-brinquedoteca": ("p14_x305.jpeg", "photo"),
    "lazer-mercado":       ("p23_x405.jpeg", "photo"),
    "lazer-lavanderia":    ("p21_x385.jpeg", "photo"),
    "lazer-oficina":       ("p22_x396.jpeg", "photo"),
    "lazer-reuniao":       ("p19_x363.jpeg", "photo"),
    "lazer-hobbybox":      ("p20_x376.jpeg", "photo"),
    "un61-planta":         ("p28_x503.jpeg", f"flat:{WHITE[0]},{WHITE[1]},{WHITE[2]}"),
    "un61-living":         ("p29_x515.jpeg", "photo"),
    "un61-cozinha":        ("p30_x520.jpeg", "photo"),
    "un61-sala":           ("p31_x527.jpeg", "photo"),
    "un43-planta":         ("p32_x539.jpeg", f"flat:{WHITE[0]},{WHITE[1]},{WHITE[2]}"),
    "un43-living":         ("p33_x551.jpeg", "photo"),
    "un43-varanda":        ("p34_x554.jpeg", "photo"),
    "un43-integrada":      ("p35_x563.jpeg", "photo"),
}

WIDTHS = [640, 1024, 1600, 2200]
LOGOS = {102, 108, 56, 49, 76}  # marcas repetidas em todas as paginas


def extract_from_pdf(pdf_path):
    """Despeja as imagens grandes do book em SRC (precisa de pymupdf)."""
    import fitz

    os.makedirs(SRC, exist_ok=True)
    doc = fitz.open(pdf_path)
    seen, n = set(), 0
    for i, page in enumerate(doc):
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in LOGOS or xref in seen:
                continue
            seen.add(xref)
            base = doc.extract_image(xref)
            if base["width"] < 700:
                continue
            path = os.path.join(SRC, f"p{i + 1:02d}_x{xref}.{base['ext']}")
            with open(path, "wb") as fh:
                fh.write(base["image"])
            n += 1
    print(f"extraidas {n} imagens para {SRC}")


def trim_dark(im, thresh=18):
    """Corta bordas pretas solidas herdadas do layout do book."""
    gray = im.convert("L").point(lambda p: 255 if p > thresh else 0)
    box = gray.getbbox()
    return im.crop(box) if box else im


def flatten_onto(im, color, lo=6, hi=52):
    """Compoe um render de fundo preto sobre `color`, com matte suave.

    O alpha sobe em rampa entre `lo` e `hi` de luminancia em vez de um corte
    seco — e o que elimina o serrilhado da silhueta. Depois recorta na bbox
    do conteudo para a imagem nao entrar na pagina com moldura vazia.
    """
    from PIL import Image as _Image

    from PIL import ImageFilter

    rgb = im.convert("RGB")
    luma = rgb.convert("L")
    # rampa: <=lo totalmente fundo, >=hi totalmente imagem
    alpha = luma.point(lambda p: 0 if p <= lo else (255 if p >= hi else round((p - lo) * 255 / (hi - lo))))

    # Abertura morfologica com erosao liquida de ~1px: MinFilter(5) tira os
    # pixels isolados de ringing E a franja de anti-aliasing que o render deixou
    # ao ser composto contra preto (ela fica azulada sobre fundo claro).
    # MaxFilter(3) devolve quase todo o volume; a silhueta perde 1px, invisivel.
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))

    box = alpha.getbbox()
    if box:
        rgb, alpha = rgb.crop(box), alpha.crop(box)

    bg = _Image.new("RGB", rgb.size, color)
    return _Image.composite(rgb, bg, alpha)


def main():
    if len(sys.argv) > 1:
        extract_from_pdf(sys.argv[1])

    os.makedirs(OUT, exist_ok=True)
    made = 0
    for name, (fn, mode) in MAP.items():
        path = os.path.join(SRC, fn)
        if not os.path.exists(path):
            print(f"  ! faltando {fn}")
            continue

        im = trim_dark(Image.open(path))
        if mode.startswith("flat:"):
            color = tuple(int(v) for v in mode[5:].split(","))
            im = flatten_onto(im, color)
        else:
            im = im.convert("RGB")

        base_w = im.width
        for w in WIDTHS:
            if w > base_w and w != WIDTHS[0]:
                continue
            r = im.resize((w, round(im.height * w / base_w)), Image.LANCZOS)
            r.save(f"{OUT}/{name}-{w}.avif", quality=58)
            r.save(f"{OUT}/{name}-{w}.webp", quality=76, method=6)
            made += 2

        fw = min(1600, base_w)
        im.resize((fw, round(im.height * fw / base_w)), Image.LANCZOS).save(
            f"{OUT}/{name}.jpg", quality=82, optimize=True, progressive=True
        )
        made += 1
        print(f"  {name:22s} {im.width}x{im.height}{'  composto' if mode.startswith('flat:') else ''}")

    og = Image.open(os.path.join(SRC, MAP['hero-aerea'][0])).convert("RGB")
    s = max(1200 / og.width, 630 / og.height)
    og = og.resize((round(og.width * s), round(og.height * s)), Image.LANCZOS)
    left, top = (og.width - 1200) // 2, (og.height - 630) // 2
    og.crop((left, top, left + 1200, top + 630)).save(f"{OUT}/og.jpg", quality=86, optimize=True)

    print(f"\n{made} arquivos em {OUT}")


if __name__ == "__main__":
    main()
