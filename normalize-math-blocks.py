#!/usr/bin/env python3
# normalize-math-blocks.py — מסיר שורות רווח-בלבד מתוך בלוקי מתמטיקה $$...$$.
# שורה ריקה בתוך $$...$$ מסיימת את הפסקה ב-Markdown, מה ש-MathJax (HTML) סובל אך
# ה-render ל-PDF דרך pandoc/LaTeX נשבר עליו ("aligned allowed only in math mode").
# הסרת שורות אלו בטוחה: הן חסרות משמעות בתוך מתמטיקה ואינן משנות את פלט ה-HTML.
#
# שימוש:  python3 normalize-math-blocks.py [--check] [files...]
#   --check : רק דיווח, בלי לכתוב.  בלי קבצים: כל *.qmd בתיקייה.
import re, sys, glob

def clean(text):
    # מאתר בלוקי $$...$$ (כולל רב-שורתיים) ומסיר בתוכם שורות שהן רק רווחים.
    n = [0]
    def repl(m):
        body = m.group(1)
        lines = body.split("\n")
        if len(lines) <= 2:
            return m.group(0)  # single-line block — nothing interior to clean
        # שומרים על השורה הראשונה והאחרונה (מבנה הבלוק) ומסירים רק שורות
        # רווח-בלבד פנימיות — הן ורק הן ששוברות את פענוח המתמטיקה.
        first, last = lines[0], lines[-1]
        interior = [ln for ln in lines[1:-1] if ln.strip() != ""]
        removed = (len(lines) - 2) - len(interior)
        if removed == 0:
            return m.group(0)
        n[0] += removed
        return "$$" + "\n".join([first] + interior + [last]) + "$$"
    out = re.sub(r"\$\$(.*?)\$\$", repl, text, flags=re.DOTALL)
    return out, n[0]

def main():
    args = sys.argv[1:]
    check = "--check" in args
    files = [a for a in args if not a.startswith("--")] or sorted(glob.glob("*.qmd"))
    total = 0
    for f in files:
        with open(f, encoding="utf-8") as fh:
            src = fh.read()
        out, removed = clean(src)
        if removed:
            total += removed
            print(f"{f}: removed {removed} blank line(s) inside $$")
            if not check:
                with open(f, "w", encoding="utf-8") as fh:
                    fh.write(out)
    print(f"TOTAL blank-in-math lines: {total}" + (" (check only, nothing written)" if check else ""))

if __name__ == "__main__":
    main()
