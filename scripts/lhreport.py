"""Resume um relatorio JSON do Lighthouse em texto curto."""
import json
import sys

METRICS = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "total-blocking-time",
    "speed-index",
]

for path in sys.argv[1:]:
    d = json.load(open(path))
    print(path.split("/")[-1])
    for key, cat in d["categories"].items():
        score = round((cat.get("score") or 0) * 100)
        print(f"   {key:16s} {score}")
    for key in METRICS:
        audit = d["audits"].get(key, {})
        print(f"   {key:28s} {audit.get('displayValue', '-')}")
    fails = [
        a for a in d["audits"].values()
        if a.get("score") is not None and a["score"] < 1
        and a.get("scoreDisplayMode") in ("binary", "numeric")
        and a["id"] not in METRICS
    ]
    if fails:
        print("   pontos abaixo de 100:")
        for a in sorted(fails, key=lambda x: x["score"])[:12]:
            print(f"     [{a['score']:.2f}] {a['id']}: {a['title'][:70]}")
    print()
