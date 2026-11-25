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
b = box(30, 460, 300, 250, BLUE_L, BLUE, [
    ("Home", 34, 700, BLUE), ("index.tsx", 20, 400, MUTED, MONO),
    ("Selector: Main or a pocket", 21, 400, INK),
    ("Left to spend, per day", 21, 400, INK), ("Income, Spent, Savings", 21, 400, INK), ("Spending pace chart", 21, 400, INK), ("Activity with Add", 21, 400, INK)])
first_level = [
    (40, "My plan", "plan.tsx", "Savings % and Every month", "My plan"),
    (210, "Month picker", "month-picker.tsx", "Go to past months", "Tap month"),
    (380, "Entry", "entry.tsx", "Add, edit or delete", "Add or tap"),
    (550, "Activity", "activity.tsx", "All entries, filtered", "See all"),
    (720, "Trends", "trends.tsx", "Last 6 months, by category", "See trends"),
    (890, "Settings", "settings.tsx", "Currency and app lock", "Gear"),
    (1060, "Pocket form", "pocket-edit.tsx", "Create, edit or delete a pocket", "Sheet, pencil"),
    (1230, "Move", "move.tsx", "Pocket to Main or pocket", "Pocket: Move"),
]
for y, t, f, d, l in first_level:
    b += box(560, y, 340, 140, TEAL_L, TEAL, [(t, 28, 700, TEAL), (f, 19, 400, MUTED, MONO), (d, 20, 400, INK)])
    b += arrow([(390, y + 70), (556, y + 70)], BLUE, "b")
    b += text(475, y + 56, l, 20, 500, BLUE)
b += box(1020, 40, 300, 140, PURPLE_L, PURPLE, [
    ("Every month", 28, 700, PURPLE), ("recurring.tsx", 19, 400, MUTED, MONO), ("Edit or stop an item", 20, 400, INK)])
b += arrow([(900, 110), (1016, 110)], PURPLE, "p")
b += text(958, 96, "Tap item", 18, 500, PURPLE)
b += box(1020, 720, 300, 140, PURPLE_L, PURPLE, [
    ("Category", 28, 700, PURPLE), ("trend-category.tsx", 19, 400, MUTED, MONO), ("One category, 6 months", 20, 400, INK)])
b += arrow([(900, 790), (1016, 790)], PURPLE, "p")
b += text(958, 776, "Tap one", 18, 500, PURPLE)
b += f'<polyline points="330,585 390,585" fill="none" stroke="{BLUE}" stroke-width="2.5"/>'
b += f'<line x1="390" y1="110" x2="390" y2="1300" stroke="{BLUE}" stroke-width="2.5"/>'
b += rect(50, 1430, 1270, 340, SLATE_L, SLATE_L, 12, 0)
for i, s_ in enumerate([
        "Home shows one space: Main (the month, named Main) or a pocket, picked with the Pill under the hero card.",
        "A pocket: balance, Save / Spend / Move actions, a This month balance chart, a Spent filter; no plan.",
        "No income yet: the card asks for it (Add income, Repeat last income).",
        "All screens return to Home. The plan starts at 20 % until you save one.",
        "Past month: My plan is hidden; its entries can still be corrected.",
        "Entry also opens from Activity, from a pocket (Save, Spend) and from My plan; Move opens from a pocket.",
        "App lock (Settings): after 60 s away the app asks for the phone's unlock again."]):
    b += text(80, 1472 + i * 42, s_, 22, 500, INK, "start")
page("1-app-map", 1360, 1800, b)

# 2. Monthly calculation
cards = [
    (40, "1. That month's plan", "savingsPercentFor", ["Latest version starting on or", "before that month, else 20 %"], "Savings goal 20 %", BLUE, BLUE_L),
    (495, "2. That month's income", "totalsByBucket", ["The sum of the income", "entries recorded that month"], "1500 € + 500 € = 2000 €", TEAL, TEAL_L),
    (950, "3. Left to spend", "monthSummary", ["Income + moved in − spent −", "the larger of goal and saved"], "2000 − 900 − 400 = 700 €", PURPLE, PURPLE_L),
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
b += rect(40, 570, 1320, 310, SLATE_L, SLATE_L, 12, 0)
b += text(70, 613, "Saved more than the goal: the saved amount counts instead (save 600 € → 2000 − 900 − 600 = 500 €).", 21, 500, INK, "start")
b += text(70, 653, "Goal rounded down to the cent. Left to spend can be negative. No income yet: Home asks for it.", 21, 500, INK, "start")
b += text(70, 693, "Current month: Home also shows left ÷ days left, today included, rounded down (700 € ÷ 10 days = 70 € a day).", 21, 500, INK, "start")
b += text(70, 733, "Every-month items are recorded on the 1st as normal entries, so they count like any other.", 21, 500, INK, "start")
b += text(70, 773, "Pace chart: the pace line runs from the every-month expenses (day 1) to what the month can spend (last day).", 21, 500, INK, "start")
b += text(70, 813, "Expenses paid from a pocket skip all these figures: they only lower that pocket's balance.", 21, 500, INK, "start")
b += text(70, 853, "Money moved into Main from a pocket adds to left, daily budget and pace (+100 € → 800 €); not income or savings.", 21, 500, INK, "start")
page("2-month-calculation", 1400, 910, b)

# 3. Architecture
b = rect(30, 30, 1050, 960, "#fafbfc", SLATE, 26, 3)
b += text(70, 76, "Your Android phone", 26, 700, SLATE, "start")
b += box(70, 100, 680, 170, BLUE_L, BLUE, [
    ("Screens", 30, 700, BLUE), ("src/app + features/*/screens", 20, 400, MUTED, MONO),
    ("Home · My plan · Activity · Trends", 21, 400, INK), ("Month picker · Entry · Every month", 21, 400, INK), ("Settings · Pocket form · Move · App lock", 21, 400, INK)])
b += box(70, 370, 320, 150, TEAL_L, TEAL, [
    ("Hooks", 28, 700, TEAL), ("features/*/hooks", 20, 400, MUTED, MONO), ("Read and reload", 21, 400, INK)])
b += box(430, 370, 320, 150, PURPLE_L, PURPLE, [
    ("Services", 28, 700, PURPLE), ("features/*/service.ts", 20, 400, MUTED, MONO), ("Validate, then write", 21, 400, INK)])
b += box(70, 620, 680, 150, AMBER_L, AMBER, [
    ("Repositories", 28, 700, AMBER), ("features/*/repository.ts", 20, 400, MUTED, MONO),
    ("The only place with SQL", 22, 400, INK), ("Check the format of what they read", 20, 400, INK)])
b += box(70, 870, 680, 110, SLATE_L, SLATE, [
    ("SQLite: cashmind.db", 28, 700, SLATE), ("plan_version · entry · recurring · pocket · move · setting", 18, 400, INK, MONO)])
b += box(800, 100, 250, 670, PURPLE_L, PURPLE, [
    ("Rules", 30, 700, PURPLE), ("features/*/rules.ts", 18, 400, MUTED, MONO), (" ", 16, 400, INK),
    ("Pure rules", 23, 700, INK), ("no database", 20, 400, INK), ("no screens", 20, 400, INK), (" ", 16, 400, INK),
    ("Validate", 22, 400, INK), ("Savings goal", 22, 400, INK), ("Left to spend", 22, 400, INK),
    ("Pocket balance", 22, 400, INK),
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
b += box(440, 24, 520, 92, PURPLE_L, PURPLE, [("Entries link by month", 25, 700, PURPLE), ("'YYYY-MM', for example '2026-11'", 19, 400, INK, MONO)])
t1, h1 = table(30, 200, 360, "plan_version", "One row per plan change", BLUE, BLUE_L, [
    ("effective_month", "TEXT · PK", True), ("savings_pct", "INTEGER 0 to 100", False)])
t3, h3 = table(470, 200, 420, "entry", "Each income, saving or expense", AMBER, AMBER_L, [
    ("id", "INTEGER · PK", True), ("date", "'YYYY-MM-DD'", True), ("kind", "3 values", False),
    ("category", "fixed list", False), ("amount_cents", "INTEGER > 0", False), ("note", "TEXT", False),
    ("created_at", "TEXT", False), ("recurring_id", "FK or empty", False), ("pocket_id", "FK or empty", False)])
t4, h4 = table(1010, 200, 360, "recurring", "One row per every-month item", PURPLE, PURPLE_L, [
    ("id", "INTEGER · PK", True), ("kind", "3 values", False), ("category", "fixed list", False),
    ("amount_cents", "INTEGER > 0", False), ("note", "TEXT", False), ("active", "0 or 1", False),
    ("last_month", "'YYYY-MM'", False), ("pocket_id", "FK or empty", False)])
t5, h5 = table(30, 830, 360, "pocket", "A place to save, spend from", TEAL, TEAL_L, [
    ("id", "INTEGER · PK", True), ("name", "TEXT 1 to 40", False), ("starting_cents", "INTEGER >= 0", False),
    ("emoji", "TEXT up to 8", False), ("color", "8 colours", False)])
t6, h6 = table(1010, 830, 360, "setting", "App options on the phone", SLATE, SLATE_L, [
    ("key", "TEXT · PK", True), ("value", "TEXT", False)])
t7, h7 = table(500, 830, 390, "move", "Pocket money to Main or a pocket", TEAL, TEAL_L, [
    ("id", "INTEGER · PK", True), ("date", "'YYYY-MM-DD'", True), ("amount_cents", "INTEGER > 0", False),
    ("from_pocket_id", "FK", False), ("to_pocket_id", "FK or empty", False), ("note", "TEXT", False),
    ("created_at", "TEXT", False)])
b += t1 + t3 + t4 + t5 + t6 + t7
b += arrow([(496, 1000), (394, 1000)], TEAL, "t", dash="8 6")
b += text(445, 980, "from · to", 15, 500, TEAL)
b += arrow([(1006, 560), (894, 560)], PURPLE, "p", dash="8 6")
b += text(950, 535, "recurring_id", 15, 500, PURPLE)
b += arrow([(300, 116), (260, 196)], BLUE, "b", dash="8 6")
b += arrow([(700, 116), (700, 196)], AMBER, "a", dash="8 6")
b += text(850, 160, "first 7 chars of date", 17, 500, AMBER)
b += text(210, 440, "A month with no row uses", 18, 500, BLUE)
b += text(210, 466, "the latest earlier one,", 18, 500, BLUE)
b += text(210, 492, "else 20 %", 18, 500, BLUE)
b += arrow([(466, 650), (210, 650), (210, 826)], TEAL, "t", dash="8 6")
b += label(340, 650, "pocket_id", 110, TEAL, 17)
b += arrow([(1190, 680), (1190, 765), (300, 765), (300, 826)], TEAL, "t", dash="8 6")
b += label(760, 765, "pocket_id (recurring)", 230, TEAL, 17)
b += rect(30, 1300, 1340, 310, SLATE_L, SLATE_L, 12, 0)
for i, s_ in enumerate(["Money is integer cents: 12,50 € is stored as 1250. kind: expense, savings or income.",
                        "A month's income is the sum of its income rows. Plans link to entries by month, not by key.",
                        "Only what you type is stored: the goal and what is left to spend are computed.",
                        "Every-month items are copied into entry on the 1st, once per month, keeping recurring_id.",
                        "Pocket balance = starting + savings in − expenses paid from it + moves in − moves out.",
                        "A move with no to_pocket_id goes into Main; it is neither income nor savings.",
                        "An expense with a pocket_id is left out of the month's figures."]):
    b += text(60, 1345 + i * 40, s_, 22, 500, INK, "start")
# Migration steps
b += text(30, 1660, "Migration steps (src/db/migrations.ts): each runs once, in order, in its own transaction", 23, 700, SLATE, "start")
nodes = [("v1", "Start", "first structure"), ("v2", "Fixed list", "fixed_item table"),
         ("v3", "Income rows", "income in expense"), ("v4", "Simple plan", "savings_pct"), ("v5", "Rename", "expense to entry"),
         ("v6", "Categories", "entry.category"), ("v7", "Every month", "recurring table"),
         ("v8", "Settings", "setting table"), ("v9", "Pockets", "pocket table, pocket_id"),
         ("v10", "Look", "pocket emoji, color"), ("v11", "Move money", "move table"),
         ("v12", "Move time", "move.created_at")]
for i, (v, a_, c) in enumerate(nodes):
    y0 = 1760 + (i // 5) * 220
    x = 110 + (i % 5) * 260
    now = i == 11
    if i % 5 == 0:
        x_end = 1150 if i + 4 < len(nodes) else 110 + (len(nodes) - 1 - i) * 260
        b += f'<line x1="110" y1="{y0}" x2="{x_end}" y2="{y0}" stroke="{LINE}" stroke-width="4"/>'
    b += f'<circle cx="{x}" cy="{y0}" r="44" fill="{TEAL_L if now else "#ffffff"}" stroke="{TEAL if now else LINE}" stroke-width="3"/>'
    b += text(x, y0 + 10, v, 28 if i < 9 else 25, 700, TEAL if now else MUTED)
    b += text(x, y0 + 85, a_, 22, 700, INK) + text(x, y0 + 119, c, 18, 400, INK)
b += text(370, 2200 - 60, "CURRENT", 18, 700, TEAL)
b += rect(30, 2360, 1340, 140, RED_L, RED_L, 12, 0)
b += text(60, 2400, "Every step keeps the rows: v5 renamed expense to entry, v6 set old entries to Other, v7 left them not repeating.", 20, 500, INK, "start")
b += text(60, 2438, "v9 turned each savings category in use into a pocket; v10 gave pockets a colour; v12 rebuilt move, keeping every move.", 20, 500, INK, "start")
b += text(60, 2476, "A failed step is rolled back and the app shows a message. A database newer than the app also shows one.", 20, 500, INK, "start")
page("4-database", 1400, 2530, b)
print(f"Diagrams written to {OUT}")
