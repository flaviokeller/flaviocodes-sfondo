import argparse
import time

from .palettes import PALETTES
from .render import contact_sheet, plan, render_all
from .styles import STYLES


def main():
    p = argparse.ArgumentParser(prog="wallpapers", description="Generate wallpaper packs.")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="list styles and palettes")

    r = sub.add_parser("render", help="render wallpapers")
    r.add_argument("--style", "-s", action="append", choices=list(STYLES), help="repeatable; default all")
    r.add_argument("--palette", "-p", help="only this palette name")
    r.add_argument("--device", "-d", choices=["desktop", "mobile", "both"], default="both")
    r.add_argument("--scale", type=float, default=1.0, help="size multiplier (0.2 = quick preview)")
    r.add_argument("--out", "-o", default="out")
    r.add_argument("--format", "-f", choices=["png", "jpg"], default="png")
    r.add_argument("--workers", "-w", type=int, default=2)
    r.add_argument("--sheets", action="store_true", help="also write contact sheets to <out>/sheets")

    a = p.parse_args()
    if a.cmd == "list":
        for s, pals in PALETTES.items():
            print(f"{s}: {', '.join(pals)}")
        return

    devices = ("desktop", "mobile") if a.device == "both" else (a.device,)
    jobs = plan(a.style, a.palette, devices)
    t0 = time.time()
    render_all(jobs, a.out, a.scale, a.format, a.workers)
    print(f"rendered {len(jobs)} images in {time.time() - t0:.1f}s -> {a.out}/")
    if a.sheets:
        for s in contact_sheet(a.out, f"{a.out}/sheets", a.style, a.format):
            print("sheet:", s)


main()
