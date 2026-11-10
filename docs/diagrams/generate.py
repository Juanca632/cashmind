"""Renders the CashMind documentation diagrams to PNG with headless Chrome.

Usage: python3 docs/diagrams/generate.py <output-dir>
"""
import html
import pathlib
import subprocess
import sys

OUT = pathlib.Path(sys.argv[1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
INK, MUTED, LINE = "#1f2933", "#5f6c7b", "#9aa5b1"
BLUE, BLUE_L = "#2563a8", "#e4effa"
TEAL, TEAL_L = "#0f7a6c", "#def3ef"
PURPLE, PURPLE_L = "#6b46b5", "#efe9fa"
SLATE, SLATE_L = "#46525f", "#eef1f4"
AMBER, AMBER_L = "#a8620a", "#fdf0d8"
RED, RED_L = "#b42b2b", "#fbe6e6"
FONT = "DejaVu Sans, Verdana, sans-serif"
MONO = "DejaVu Sans Mono, monospace"


def text(x, y, s, size=22, weight=400, color=INK, anchor="middle", font=FONT):
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" '
            f'text-anchor="{anchor}" font-family="{font}">{html.escape(s)}</text>')


def rect(x, y, w, h, fill, stroke, r=14, sw=2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def box(x, y, w, h, fill, stroke, lines):
    """lines: (text, size, weight, color[, font])"""
    parts = [rect(x, y, w, h, fill, stroke)]
    total = sum(l[1] * 1.38 for l in lines)
    cy = y + (h - total) / 2
    for l in lines:
        cy += l[1] * 1.38
        font = l[4] if len(l) > 4 else FONT
        parts.append(text(x + w / 2, cy - l[1] * 0.3, l[0], l[1], l[2], l[3], font=font))
    return "".join(parts)


MARKERS = "".join(
    f'<marker id="a{n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
    f'<path d="M0 0L10 5L0 10z" fill="{c}"/></marker>'
    for n, c in [("g", LINE), ("b", BLUE), ("t", TEAL), ("a", AMBER), ("p", PURPLE), ("s", SLATE), ("r", RED)]
)


def arrow(pts, color=LINE, mark="g", dash=None, sw=2.5):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    p = " ".join(f"{x},{y}" for x, y in pts)
    return f'<polyline points="{p}" fill="none" stroke="{color}" stroke-width="{sw}"{d} marker-end="url(#a{mark})"/>'


def label(x, y, s, w, color=MUTED, size=19):
    return rect(x - w / 2, y - 18, w, 34, "#ffffff", "#ffffff", 6, 0) + text(x, y + 6, s, size, 500, color)


def page(name, w, h, body):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
           f'<defs>{MARKERS}</defs><rect width="{w}" height="{h}" fill="#ffffff"/>{body}</svg>')
    (OUT / f"{name}.html").write_text(
        f'<!doctype html><meta charset="utf-8"><style>html,body{{margin:0;padding:0;background:#fff}}svg{{display:block}}</style>{svg}')
    subprocess.run(
        ["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
         "--force-device-scale-factor=1.5", f"--window-size={w},{h}", f"--screenshot={OUT / name}.png",
         f"file://{OUT / name}.html"],
        check=True, capture_output=True, timeout=60)
    (OUT / f"{name}.html").unlink()


# 1. Screen map
b = box(50, 270, 280, 210, BLUE_L, BLUE, [
    ("Home", 34, 700, BLUE), ("index.tsx", 20, 400, MUTED, MONO),
    ("Left to spend card", 21, 400, INK), ("Income, Spent, Savings", 21, 400, INK), ("Activity with Add", 21, 400, INK)])
first_level = [
    (115, "My plan", "plan.tsx", "One savings percentage", "My plan"),
    (395, "Month picker", "month-picker.tsx", "Go to past months", "Tap month"),
    (565, "Entry", "entry.tsx", "Add, edit or delete", "Add or tap"),
]
for y, t, f, d, l in first_level:
    b += box(560, y, 340, 140, TEAL_L, TEAL, [(t, 28, 700, TEAL), (f, 19, 400, MUTED, MONO), (d, 20, 400, INK)])
    b += arrow([(390, y + 70), (556, y + 70)], BLUE, "b")
    b += text(475, y + 56, l, 20, 500, BLUE)
b += f'<polyline points="330,375 390,375" fill="none" stroke="{BLUE}" stroke-width="2.5"/>'
b += f'<line x1="390" y1="185" x2="390" y2="635" stroke="{BLUE}" stroke-width="2.5"/>'
b += rect(50, 740, 850, 160, SLATE_L, SLATE_L, 12, 0)
b += text(80, 782, "No income yet: the card asks for it (Add income, Repeat last income).", 22, 500, INK, "start")
b += text(80, 824, "All screens return to Home. The plan starts at 20 % until you save one.", 22, 500, INK, "start")
b += text(80, 866, "Past month: My plan is hidden; its entries can still be corrected.", 22, 500, INK, "start")
page("1-app-map", 960, 930, b)

# 2. Monthly calculation
cards = [
    (40, "1. That month's plan", "savingsPercentFor", ["Latest version starting on or", "before that month, else 20 %"], "Savings goal 20 %", BLUE, BLUE_L),
    (495, "2. That month's income", "totalsByBucket", ["The sum of the income", "entries recorded that month"], "1500 € + 500 € = 2000 €", TEAL, TEAL_L),
    (950, "3. Left to spend", "monthSummary", ["Income − spent − the larger", "of the goal and what was saved"], "2000 − 900 − 400 = 700 €", PURPLE, PURPLE_L),
]
b = ""
for x, t, f, d, e, c, l in cards:
    b += box(x, 30, 410, 260, l, c, [(t, 26, 700, c), (f, 19, 400, MUTED, MONO), (" ", 12, 400, INK), (d[0], 20, 400, INK), (d[1], 20, 400, INK), (" ", 12, 400, INK), (e, 19, 700, INK)])
b += arrow([(450, 160), (491, 160)], LINE, "g", sw=3) + arrow([(905, 160), (946, 160)], LINE, "g", sw=3)
b += text(40, 360, "Invented example: income 2000 €, goal 20 % = 400 €, saved 150 €, spent 900 €", 25, 700, INK, "start")
segs = [(40, 594, "Spent", "900 €", BLUE, BLUE_L), (634, 264, "Goal kept", "400 €", PURPLE, PURPLE_L), (898, 462, "Left to spend", "700 €", TEAL, TEAL_L)]
for x, w, n, v, c, l in segs:
    b += box(x, 385, w, 120, l, c, [(n, 25, 700, c), (v, 28, 700, INK)])
b += text(700, 540, "Income 2000 €", 20, 700, MUTED)
b += rect(40, 570, 1320, 110, SLATE_L, SLATE_L, 12, 0)
b += text(70, 613, "Saved more than the goal: the saved amount counts instead (save 600 € → 2000 − 900 − 600 = 500 €).", 21, 500, INK, "start")
b += text(70, 653, "Goal rounded down to the cent. Left to spend can be negative. No income yet: Home asks for it.", 21, 500, INK, "start")
page("2-month-calculation", 1400, 710, b)

# 3. Architecture
b = rect(30, 30, 1050, 960, "#fafbfc", SLATE, 26, 3)
b += text(70, 76, "Your Android phone", 26, 700, SLATE, "start")
b += box(70, 100, 680, 170, BLUE_L, BLUE, [
    ("Screens", 30, 700, BLUE), ("src/app + features/*/screens", 20, 400, MUTED, MONO),
    ("Home · My plan", 21, 400, INK), ("Month picker · Entry", 22, 400, INK)])
b += box(70, 370, 320, 150, TEAL_L, TEAL, [
    ("Hooks", 28, 700, TEAL), ("features/*/hooks", 20, 400, MUTED, MONO), ("Read and reload", 21, 400, INK)])
b += box(430, 370, 320, 150, PURPLE_L, PURPLE, [
    ("Services", 28, 700, PURPLE), ("features/*/service.ts", 20, 400, MUTED, MONO), ("Validate, then write", 21, 400, INK)])
b += box(70, 620, 680, 150, AMBER_L, AMBER, [
    ("Repositories", 28, 700, AMBER), ("features/*/repository.ts", 20, 400, MUTED, MONO),
    ("The only place with SQL", 22, 400, INK), ("Check the format of what they read", 20, 400, INK)])
b += box(70, 870, 680, 110, SLATE_L, SLATE, [
    ("SQLite: cashmind.db", 28, 700, SLATE), ("plan_version · entry", 20, 400, INK, MONO)])
b += box(800, 100, 250, 670, PURPLE_L, PURPLE, [
    ("Rules", 30, 700, PURPLE), ("features/*/rules.ts", 18, 400, MUTED, MONO), (" ", 16, 400, INK),
    ("Pure rules", 23, 700, INK), ("no database", 20, 400, INK), ("no screens", 20, 400, INK), (" ", 16, 400, INK),
    ("Validate", 22, 400, INK), ("Savings goal", 22, 400, INK), ("Left to spend", 22, 400, INK),
    ("Limit 900 000,00 €", 20, 400, INK), (" ", 16, 400, INK), ("Integer cents", 22, 700, PURPLE)])
b += arrow([(230, 270), (230, 366)], BLUE, "b") + label(230, 318, "read", 80, BLUE)
b += arrow([(590, 270), (590, 366)], PURPLE, "p") + label(590, 318, "save", 80, PURPLE)
b += arrow([(230, 520), (230, 616)], TEAL, "t") + label(230, 568, "fetch data", 150, TEAL)
b += arrow([(590, 520), (590, 616)], AMBER, "a") + label(590, 568, "write", 90, AMBER)
b += arrow([(410, 770), (410, 866)], SLATE, "s") + label(410, 818, "Parameterized SQL", 240, SLATE)
b += arrow([(750, 445), (796, 445)], PURPLE, "p")
b += box(1125, 130, 245, 170, RED_L, RED, [
    ("Internet", 26, 700, RED), ("No network, backend", 20, 400, INK), ("or analytics", 20, 400, INK)])
b += f'<line x1="1080" y1="215" x2="1125" y2="215" stroke="{RED}" stroke-width="3" stroke-dasharray="7 6"/>'
b += f'<path d="M1090 202l26 26M1116 202l-26 26" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>'
b += box(1125, 790, 245, 200, AMBER_L, AMBER, [
    ("Google Drive", 26, 700, AMBER), ("Android automatic", 20, 400, INK), ("backup", 20, 400, INK),
    ("on by default", 20, 700, AMBER)])
b += arrow([(750, 898), (1121, 898)], AMBER, "a", dash="9 7")
page("3-architecture", 1400, 1020, b)

# 4. Database and migration steps
def table(x, y, w, title, sub, color, light, rows):
    h = 112 + 46 * len(rows)
    s = rect(x, y, w, h, "#ffffff", color, 14, 2.5)
    s += f'<path d="M{x+1} {y+112}V{y+14}a13 13 0 0 1 13-13H{x+w-14}a13 13 0 0 1 13 13V{y+112}z" fill="{light}"/>'
    s += text(x + w / 2, y + 48, title, 22, 700, color, font=MONO)
    s += text(x + w / 2, y + 88, sub, 19, 400, INK)
    for i, (name, kind, key) in enumerate(rows):
        ry = y + 112 + 46 * i
        if key:
            s += f'<rect x="{x+2}" y="{ry}" width="{w-4}" height="46" fill="{light}"/>'
        if i:
            s += f'<line x1="{x+16}" y1="{ry}" x2="{x+w-16}" y2="{ry}" stroke="#e3e8ee" stroke-width="1.5"/>'
        s += text(x + 18, ry + 31, name, 19, 700 if key else 400, INK, "start", MONO)
        s += text(x + w - 18, ry + 31, kind, 17, 400, MUTED, "end", MONO)
    return s, h


b = box(30, 24, 330, 92, SLATE_L, SLATE, [("STRICT tables", 25, 700, SLATE), ("with CHECK rules", 19, 400, INK)])
b += box(440, 24, 520, 92, PURPLE_L, PURPLE, [("Everything links by month", 25, 700, PURPLE), ("'YYYY-MM', for example '2026-11'", 19, 400, INK, MONO)])
t1, h1 = table(200, 200, 430, "plan_version", "One row per plan change", BLUE, BLUE_L, [
    ("effective_month", "TEXT · PK", True), ("savings_pct", "INTEGER 0 to 100", False)])


b = box(30, 24, 330, 92, SLATE_L, SLATE, [("STRICT tables", 25, 700, SLATE), ("with CHECK rules", 19, 400, INK)])
b += box(440, 24, 520, 92, PURPLE_L, PURPLE, [("Everything links by month", 25, 700, PURPLE), ("'YYYY-MM', for example '2026-11'", 19, 400, INK, MONO)])
t1, h1 = table(200, 200, 430, "plan_version", "One row per plan change", BLUE, BLUE_L, [
    ("effective_month", "TEXT · PK", True), ("savings_pct", "INTEGER 0 to 100", False)])
t3, h3 = table(760, 200, 340, "entry", "Each income, saving or expense", AMBER, AMBER_L, [
    ("id", "INTEGER · PK", True), ("date", "'YYYY-MM-DD'", True), ("kind", "3 values", False),
    ("amount_cents", "INTEGER > 0", False), ("note", "TEXT", False), ("created_at", "TEXT", False)])
b += t1 + t3
b += arrow([(500, 116), (425, 196)], BLUE, "b", dash="8 6")
b += arrow([(860, 116), (930, 196)], AMBER, "a", dash="8 6")
b += text(1060, 160, "first 7 chars of date", 17, 500, AMBER)
b += text(415, 450, "A month with no row uses the latest", 18, 500, BLUE)
b += text(415, 476, "earlier one, else 20 %", 18, 500, BLUE)
b += rect(30, 640, 1340, 140, SLATE_L, SLATE_L, 12, 0)
for i, s_ in enumerate(["Money is integer cents: 12,50 € is stored as 1250. kind: expense, savings or income.",
                        "A month's income is the sum of its income rows. No foreign keys: the month is the link.",
                        "Only what you type is stored: the goal and what is left to spend are computed."]):
    b += text(60, 680 + i * 40, s_, 22, 500, INK, "start")
# Migration steps
b += text(30, 850, "Migration steps (src/db/migrations.ts): each runs once, in order, in its own transaction", 23, 700, SLATE, "start")
y0 = 935
b += f'<line x1="170" y1="{y0}" x2="1170" y2="{y0}" stroke="{LINE}" stroke-width="4"/>'
nodes = [("v1", "Start", "first structure"), ("v2", "Fixed list", "fixed_item table"),
         ("v3", "Income rows", "income in expense"), ("v4", "Simple plan", "savings_pct"), ("v5", "Rename", "expense to entry")]
for i, (v, a_, c) in enumerate(nodes):
    x = 170 + i * 250
    now = i == 4
    b += f'<circle cx="{x}" cy="{y0}" r="44" fill="{TEAL_L if now else "#ffffff"}" stroke="{TEAL if now else LINE}" stroke-width="3"/>'
    b += text(x, y0 + 10, v, 28, 700, TEAL if now else MUTED)
    b += text(x, y0 + 85, a_, 24, 700, INK) + text(x, y0 + 119, c, 21, 400, INK)
b += text(1170, y0 - 60, "CURRENT", 18, 700, TEAL)
b += rect(30, 1100, 1340, 100, RED_L, RED_L, 12, 0)
b += text(60, 1140, "v5: the expense table became entry and bucket became kind; every row kept.", 20, 500, INK, "start")
b += text(60, 1178, "A failed step is rolled back and the app shows a message. A database newer than the app also shows one.", 20, 500, INK, "start")
page("4-database", 1400, 1230, b)
print(f"Diagrams written to {OUT}")
