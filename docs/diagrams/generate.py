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
    ("What is left for wants", 21, 400, INK), ("and the expenses", 21, 400, INK)])
first_level = [
    (115, "Monthly plan", "plan.tsx", "See your plan, read-only", "My plan"),
    (395, "Month picker", "month-picker.tsx", "Go to past months", "Tap month"),
    (565, "Expense", "expense.tsx", "Add, edit or delete", "Add or tap"),
]
for y, t, f, d, l in first_level:
    b += box(560, y, 340, 140, TEAL_L, TEAL, [(t, 28, 700, TEAL), (f, 19, 400, MUTED, MONO), (d, 20, 400, INK)])
    b += arrow([(390, y + 70), (556, y + 70)], BLUE, "b")
    b += text(475, y + 56, l, 20, 500, BLUE)
b += f'<polyline points="330,375 390,375" fill="none" stroke="{BLUE}" stroke-width="2.5"/>'
b += f'<line x1="390" y1="185" x2="390" y2="635" stroke="{BLUE}" stroke-width="2.5"/>'
second_level = [
    (30, "Edit plan", "plan-edit.tsx", "List, income, split", "Edit plan"),
    (200, "Month income", "month-income.tsx", "One different month", "This month"),
]
for y, t, f, d, l in second_level:
    b += box(1080, y, 290, 140, TEAL_L, TEAL, [(t, 26, 700, TEAL), (f, 18, 400, MUTED, MONO), (d, 20, 400, INK)])
    b += arrow([(940, y + 70), (1076, y + 70)], BLUE, "b")
    b += text(1008, y + 56, l, 20, 500, BLUE)
b += f'<polyline points="900,185 940,185" fill="none" stroke="{BLUE}" stroke-width="2.5"/>'
b += f'<line x1="940" y1="100" x2="940" y2="270" stroke="{BLUE}" stroke-width="2.5"/>'
b += rect(50, 740, 1320, 160, SLATE_L, SLATE_L, 12, 0)
b += text(80, 782, "No saved plan: Home only offers to create one, and opens Edit plan directly.", 22, 500, INK, "start")
b += text(80, 824, "Edit plan and Month income return to Monthly plan. The other screens return to Home.", 22, 500, INK, "start")
b += text(80, 866, "Past month: the plan is read-only; its expenses can still be corrected.", 22, 500, INK, "start")
page("1-app-map", 1400, 930, b)

# 2. Architecture
b = rect(30, 30, 1050, 960, "#fafbfc", SLATE, 26, 3)
b += text(70, 76, "Your Android phone", 26, 700, SLATE, "start")
b += box(70, 100, 680, 170, BLUE_L, BLUE, [
    ("Screens", 30, 700, BLUE), ("src/app + features/*/screens", 20, 400, MUTED, MONO),
    ("Home · Plan · Edit plan · Month income", 21, 400, INK), ("Month picker · Expense", 22, 400, INK)])
b += box(70, 370, 320, 150, TEAL_L, TEAL, [
    ("Hooks", 28, 700, TEAL), ("features/*/hooks", 20, 400, MUTED, MONO), ("Read and reload", 21, 400, INK)])
b += box(430, 370, 320, 150, PURPLE_L, PURPLE, [
    ("Services", 28, 700, PURPLE), ("features/*/service.ts", 20, 400, MUTED, MONO), ("Validate, then write", 21, 400, INK)])
b += box(70, 620, 680, 150, AMBER_L, AMBER, [
    ("Repositories", 28, 700, AMBER), ("features/*/repository.ts", 20, 400, MUTED, MONO),
    ("The only place with SQL", 22, 400, INK), ("Check the format of what they read", 20, 400, INK)])
b += box(70, 870, 680, 110, SLATE_L, SLATE, [
    ("SQLite: cashmind.db", 28, 700, SLATE), ("plan_version · fixed_item · month_income_override · expense", 17, 400, INK, MONO)])
b += box(800, 100, 250, 670, PURPLE_L, PURPLE, [
    ("Rules", 30, 700, PURPLE), ("features/*/rules.ts", 18, 400, MUTED, MONO), (" ", 16, 400, INK),
    ("Pure rules", 23, 700, INK), ("no database", 20, 400, INK), ("no screens", 20, 400, INK), (" ", 16, 400, INK),
    ("Validate", 22, 400, INK), ("Compute targets", 22, 400, INK), ("Plan for each month", 22, 400, INK),
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
    ("TO VALIDATE", 20, 700, AMBER)])
b += arrow([(750, 898), (1121, 898)], AMBER, "a", dash="9 7")
page("2-architecture", 1400, 1020, b)

# 3. Add-expense flow
steps = [
    ("1", "Enter the expense", "expense-screen.tsx", BLUE, BLUE_L),
    ("2", "Validate", "addExpense + rules", PURPLE, PURPLE_L),
    ("3", "Prepare", "insertExpense", AMBER, AMBER_L),
    ("4", "Save", "expense table", SLATE, SLATE_L),
    ("5", "Back to Home", "on success", BLUE, BLUE_L),
    ("6", "Reload expenses", "useMonthExpenses", TEAL, TEAL_L),
    ("7", "Sum and compare", "totalsByBucket", PURPLE, PURPLE_L),
    ("8", "See your progress", "home-screen.tsx", BLUE, BLUE_L),
]
xs = [40, 385, 730, 1075]
order = [(xs[0], 40), (xs[1], 40), (xs[2], 40), (xs[3], 40), (xs[3], 290), (xs[2], 290), (xs[1], 290), (xs[0], 290)]
b = ""
for (x, y), (n, t, f, c, l) in zip(order, steps):
    b += box(x, y, 285, 170, l, c, [(n, 30, 700, c), (t, 25, 700, INK), (f, 20, 400, MUTED, MONO)])
for i in range(3):
    b += arrow([(xs[i] + 285, 125), (xs[i + 1] - 4, 125)], LINE, "g", sw=3)
b += arrow([(xs[3] + 142, 210), (xs[3] + 142, 286)], LINE, "g", sw=3)
for i in range(3, 0, -1):
    b += arrow([(xs[i], 375), (xs[i - 1] + 289, 375)], LINE, "g", sw=3)
legend = [("Screen", BLUE, BLUE_L), ("Service + rules", PURPLE, PURPLE_L), ("Repository", AMBER, AMBER_L), ("SQLite", SLATE, SLATE_L), ("Hook", TEAL, TEAL_L)]
for i, (t, c, l) in enumerate(legend):
    x = [80, 240, 520, 770, 1000][i]
    b += rect(x, 498, 30, 30, l, c, 6) + text(x + 42, 521, t, 21, 500, INK, "start")
b += rect(40, 560, 1320, 60, SLATE_L, SLATE_L, 12, 0)
b += text(70, 598, "If validation or saving fails, a message appears and the form stays open.", 21, 500, INK, "start")
page("3-expense-flow", 1400, 650, b)


# 4. Database
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
t1, h1 = table(30, 200, 350, "plan_version", "One row per plan change", BLUE, BLUE_L, [
    ("effective_month", "TEXT · PK", True), ("income_cents", "INTEGER > 0", False), ("kept_bucket", "leisure|savings", False), ("kept_unit", "'eur' | 'pct'", False), ("kept_value", "INTEGER ≥ 0", False)])
tf, hf = table(400, 200, 310, "fixed_item", "One fixed expense of a plan", PURPLE, PURPLE_L, [
    ("id", "INTEGER · PK", True), ("effective_month", "TEXT", False), ("name", "1 to 40 chars", False), ("amount_cents", "INTEGER > 0", False)])
t2, h2 = table(730, 200, 320, "month_income_override", "Other income that month", TEAL, TEAL_L, [("month", "TEXT · PK", True), ("income_cents", "INTEGER > 0", False)])
t3, h3 = table(1070, 200, 300, "expense", "Each expense or saving", AMBER, AMBER_L, [
    ("id", "INTEGER · PK", True), ("date", "'YYYY-MM-DD'", True), ("bucket", "3 values", False),
    ("amount_cents", "INTEGER > 0", False), ("note", "TEXT", False), ("created_at", "TEXT", False)])
b += t1 + tf + t2 + t3
b += arrow([(440, 116), (205, 196)], BLUE, "b", dash="8 6")
b += arrow([(600, 116), (555, 196)], PURPLE, "p", dash="8 6")
b += arrow([(780, 116), (890, 196)], TEAL, "t", dash="8 6")
b += arrow([(930, 116), (1220, 196)], AMBER, "a", dash="8 6")
b += text(1190, 160, "first 7 chars of date", 17, 500, AMBER)
b += rect(30, 660, 1340, 230, SLATE_L, SLATE_L, 12, 0)
for i, s_ in enumerate(["All tables are STRICT: SQLite rejects a value of the wrong type.",
                        "CHECK rules: month 'YYYY-MM', date 'YYYY-MM-DD', amounts above 0, fixed lists for units and buckets.",
                        "kept_value: cents if the unit is eur, whole number up to 100 if pct. Fixed expenses are rows of fixed_item.",
                        "No foreign keys: the code resolves the month link.",
                        "The automatic category (leisure or savings) is not stored: it is computed."]):
    b += text(60, 702 + i * 42, s_, 22, 500, INK, "start")
page("4-database", 1400, 920, b)

# 5. Monthly calculation
cards = [
    (40, "1. That month's plan", "planForMonth", ["Latest version starting", "on or before that month"], "2000 € · fixed list 1000 € · savings 30 %", BLUE, BLUE_L),
    (495, "2. That month's income", "incomeForMonth", ["The month's own if changed,", "otherwise the plan's"], "This month you earn 2500 €", TEAL, TEAL_L),
    (950, "3. Split", "targetsFor", ["Fixed stays; savings is its % of", "the income, wants takes the rest"], "Savings 30 % of 2500 = 750 €", PURPLE, PURPLE_L),
]
b = ""
for x, t, f, d, e, c, l in cards:
    b += box(x, 30, 410, 260, l, c, [(t, 26, 700, c), (f, 19, 400, MUTED, MONO), (" ", 12, 400, INK), (d[0], 20, 400, INK), (d[1], 20, 400, INK), (" ", 12, 400, INK), (e, 17, 700, INK)])
b += arrow([(450, 160), (491, 160)], LINE, "g", sw=3) + arrow([(905, 160), (946, 160)], LINE, "g", sw=3)
b += text(40, 360, "Example result: 2500 €", 26, 700, INK, "start")
segs = [(40, 528, "Fixed", "1000 €", BLUE, BLUE_L), (568, 396, "Wants", "750 €", TEAL, TEAL_L), (964, 396, "Savings", "750 €", PURPLE, PURPLE_L)]
for x, w, n, v, c, l in segs:
    b += box(x, 385, w, 120, l, c, [(n, 25, 700, c), (v, 28, 700, INK)])
b += rect(40, 545, 1320, 110, SLATE_L, SLATE_L, 12, 0)
b += text(70, 588, "If income doesn't cover fixed expenses: wants and savings are 0 € and a shortfall warning appears.", 21, 500, INK, "start")
b += text(70, 628, "Savings is capped at what is left after fixed; wants takes the rest, so the parts add up to the income.", 21, 500, INK, "start")
page("5-month-calculation", 1400, 680, b)

# 6. Migrations
b = f'<line x1="170" y1="85" x2="830" y2="85" stroke="{LINE}" stroke-width="4"/>'
nodes = [("v1", "Starting point", "first structure", False, True), ("v2", "Fixed expenses list", "fixed_item table", True, True), ("v3", "Next change", "one new step", False, False)]
for i, (v, a_, c, now, done) in enumerate(nodes):
    x = 170 + i * 330
    dash = "" if done else ' stroke-dasharray="8 6"'
    b += f'<circle cx="{x}" cy="85" r="44" fill="{TEAL_L if now else "#ffffff"}" stroke="{TEAL if now else LINE}" stroke-width="3"{dash}/>'
    b += text(x, 95, v, 28, 700, TEAL if now else MUTED)
    b += text(x, 170, a_, 24, 700, INK) + text(x, 204, c, 21, 400, INK)
b += text(500, 240, "CURRENT", 18, 700, TEAL)
b += text(920, 85, "Each step runs in", 22, 700, SLATE, "start") + text(920, 115, "its own transaction", 22, 700, SLATE, "start")
b += box(40, 280, 300, 100, BLUE_L, BLUE, [("App starts", 24, 700, BLUE), ("reads user_version", 19, 400, INK, MONO)])
b += box(400, 280, 360, 100, BLUE_L, BLUE, [("Apply missing steps", 24, 700, BLUE), ("in order, one at a time", 19, 400, INK)])
b += box(820, 280, 300, 100, TEAL_L, TEAL, [("App opens", 24, 700, TEAL), ("data kept", 19, 400, INK)])
b += arrow([(340, 330), (396, 330)], LINE, "g", sw=3) + arrow([(760, 330), (816, 330)], LINE, "g", sw=3)
b += box(400, 450, 360, 110, RED_L, RED, [("A step fails", 24, 700, RED), ("rolled back, message shown", 19, 400, INK)])
b += box(40, 450, 300, 110, RED_L, RED, [("Database newer", 24, 700, RED), ("than the app: message", 19, 400, INK)])
b += arrow([(580, 384), (580, 446)], RED, "r", dash="8 6")
b += arrow([(190, 384), (190, 446)], RED, "r", dash="8 6")
b += rect(820, 450, 540, 110, SLATE_L, SLATE_L, 12, 0)
b += text(845, 495, "The app does not close: it shows a message", 21, 500, INK, "start")
b += text(845, 535, "and asks to install the latest version.", 21, 500, INK, "start")
page("6-migrations", 1400, 600, b)

# 7. Workflow
flow = [("Specify", "/speckit-specify", BLUE, BLUE_L), ("Plan", "/speckit-plan", BLUE, BLUE_L), ("Tasks", "/speckit-tasks", BLUE, BLUE_L),
        ("Implement", "/speckit-implement", BLUE, BLUE_L), ("Converge", "/speckit-converge", BLUE, BLUE_L)]
b = ""
for i, (t, f, c, l) in enumerate(flow):
    x = 30 + i * 275
    b += box(x, 40, 240, 130, l, c, [(t, 26, 700, c), (f, 16, 400, MUTED, MONO)])
    if i < 4:
        b += arrow([(x + 240, 105), (x + 271, 105)], LINE, "g", sw=3)
b += box(1000 - 0, 250, 370, 130, AMBER_L, AMBER, [("code-reviewer", 25, 700, AMBER, MONO), ("Reviews before each commit", 20, 400, INK)])
b += arrow([(1250, 170), (1250, 246)], LINE, "g", sw=3)
b += box(570, 250, 340, 130, TEAL_L, TEAL, [("You decide", 27, 700, TEAL), ("Commit only with your OK", 20, 400, INK)])
b += arrow([(1000, 315), (914, 315)], LINE, "g", sw=3)
b += box(30, 250, 450, 130, PURPLE_L, PURPLE, [("test-writer", 25, 700, PURPLE, MONO), ("Tests from the spec, blind to the code", 19, 400, INK)])
b += arrow([(150, 170), (150, 246)], PURPLE, "p", dash="8 6") + text(170, 214, "reads the spec, when asked", 18, 500, PURPLE, "start")
b += box(30, 430, 350, 110, SLATE_L, SLATE, [("ui-auditor", 25, 700, SLATE, MONO), ("Reviews design, when asked", 18, 400, INK)])
b += box(400, 430, 350, 110, SLATE_L, SLATE, [("docs-keeper", 25, 700, SLATE, MONO), ("Syncs Notion after a feature", 18, 400, INK)])
b += box(770, 430, 600, 110, SLATE_L, SLATE, [("Baseline specs: 001, 002 and 003", 23, 700, SLATE), ("Updated when a feature changes their behavior", 18, 400, INK)])
page("7-workflow", 1400, 570, b)
print(f"Diagrams written to {OUT}")
