#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
renumber-envs.py — סקריפט post-render של Quarto (רץ אוטומטית אחרי quarto render).

מטרה: יישור המספור באתר למספור של הספר (downloads/book.pdf):
  * הגדרה / משפט / למה / טענה / מסקנה — מונה משותף אחד לכל פרק (8.1, 8.2, ...)
  * דוגמה — מונה נפרד לפרק ; תרגיל — מונה נפרד ; הערה — מונה נפרד
  * הוכחה ופתרון — ללא מספור
Quarto לבדו ממספר כל סוג בנפרד, ולכן הסקריפט משכתב את הכותרות ואת הטקסט של כל
ההפניות (@refs) בכל הפרקים, כולל הפניות בין-פרקיות. בנוסף:
  * הערות (::: remark) מקבלות כותרת "הערה N" במקום "Remark" (ובלי ריבוע QED)
  * הוכחות מקבלות כותרת "הוכחה" במקום "Proof"
  * תיבות "פתרון" מקבלות class בשם solution לצורך צביעה ב-CSS
"""
import os
import re
import sys
import glob
from collections import defaultdict

OUT_DIR = os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_book")

# קבוצות מונים: משפחת המשפטים חולקת מונה; דוגמה/תרגיל/הערה נפרדים
GROUP = {
    "definition": "thmlike", "theorem": "thmlike", "lemma": "thmlike",
    "proposition": "thmlike", "corollary": "thmlike",
    "example": "example", "exercise": "exercise", "remark": "remark",
}
LABEL = {
    "definition": "הגדרה", "theorem": "משפט", "lemma": "למה",
    "proposition": "טענה", "corollary": "מסקנה",
    "example": "דוגמה", "exercise": "תרגיל", "remark": "הערה",
}
ENV_CLASSES = set(GROUP)

DIV_RE = re.compile(r'<div(?=[ >])([^>]*)>')
CLASS_RE = re.compile(r'class="([^"]*)"')
ID_RE = re.compile(r'id="([^"]*)"')
TITLE_ATTR_RE = re.compile(r'title="([^"]*)"')

# הכותרת ש-Quarto שם בתוך הפסקה הראשונה של סביבה ממוספרת
THM_TITLE_RE = re.compile(
    r'<p><span class="theorem-title"><strong>[^<]*</strong></span>\s*')
# כותרת של סביבה בסגנון הוכחה (Proof/Remark/Solution)
PROOF_TITLE_RE = re.compile(
    r'<p><span class="proof-title">(?:<em>)?([A-Za-z]+)(?:</em>)?\.?\s*</span>\s*')

def title_block(label, num=None):
    # בלי <strong>: ה-CSS של .theorem-title כבר מבליט. <strong> מוסיף
    # font-weight:bolder של bootstrap וגורם ל-fallback של פונט בעברית.
    text = f"{label} {num}" if num else label
    return f'<div class="theorem-title">{text}</div>'

def chapter_files():
    files = sorted(glob.glob(os.path.join(OUT_DIR, "*.html")))
    return [f for f in files if os.path.basename(f) != "search.html"]

def main():
    ref_map = {}  # id -> (label, num)

    # ---------- מעבר ראשון: מספור כותרות ----------
    for path in chapter_files():
        with open(path, encoding="utf-8") as fh:
            html = fh.read()

        chap_m = re.search(r'<span class="chapter-number">(\d+)</span>', html)
        if not chap_m:
            continue  # שער / רשימת מקורות וכד'
        chap = chap_m.group(1)

        counters = defaultdict(int)
        edits = []  # (start, end, replacement)

        for dm in DIV_RE.finditer(html):
            attrs = dm.group(1)
            cm = CLASS_RE.search(attrs)
            if not cm:
                continue
            classes = cm.group(1).split()

            # תיבת "פתרון" — רק תוספת class לצביעה
            if "callout" in classes:
                tm = TITLE_ATTR_RE.search(attrs)
                if tm and tm.group(1) in ("פתרון", "הצג פתרון") and "solution" not in classes:
                    s = dm.start(1) + cm.start(1), dm.start(1) + cm.end(1)
                    edits.append((s[0], s[1], cm.group(1) + " solution"))
                continue

            # הטווח לחיפוש כותרת: עד ה-div הבא, כדי לא לגעת בכותרת של סביבה אחרת
            nxt = html.find('<div', dm.end())
            region = html[dm.end():nxt if nxt != -1 else dm.end() + 800]

            # סביבות בסגנון הוכחה: Proof / Remark (כך Quarto מרנדר ::: remark)
            # הוכחה/פתרון (::: proof) — class="proof" בלבד, כותרת עברית ללא מספור
            if classes == ["proof"]:
                pm = PROOF_TITLE_RE.search(region)
                heb = "פתרון" if (pm and pm.group(1) == "Solution") else "הוכחה"
                if pm:
                    edits.append((dm.end() + pm.start(), dm.end() + pm.end(),
                                  title_block(heb) + "<p>"))
                else:
                    edits.append((dm.end(), dm.end(), title_block(heb)))
                continue

            env = next((c for c in classes if c in ENV_CLASSES and c != "theorem"), None)
            if env is None and "theorem" in classes:
                env = "theorem"
            if env is None:
                continue

            group = GROUP[env]
            counters[group] += 1
            num = f"{chap}.{counters[group]}"
            label = LABEL[env]

            im = ID_RE.search(attrs)
            if im:
                ref_map[im.group(1)] = (label, num)

            # הערה מגיעה מ-Quarto כ-class="proof remark" עם span של proof-title ("Remark").
            # מסירים את class "proof" (למניעת ריבוע QED וצבע ירוק) ומחליפים את ה-span.
            is_remark_style = "proof" in classes and env == "remark"
            if is_remark_style:
                edits.append((dm.start(1) + cm.start(1), dm.start(1) + cm.end(1), "remark"))

            tm = THM_TITLE_RE.search(region) if "theorem" in classes else None
            pm = PROOF_TITLE_RE.search(region) if (tm is None and is_remark_style) else None
            if tm:    # סביבה נייטיב עם כותרת של Quarto — משכתבים אותה
                edits.append((dm.end() + tm.start(), dm.end() + tm.end(),
                              title_block(label, num) + "<p>"))
            elif pm:  # הערה — מחליפים את "Remark" בכותרת עברית ממוספרת
                edits.append((dm.end() + pm.start(), dm.end() + pm.end(),
                              title_block(label, num) + "<p>"))
            else:     # סביבה בלי כותרת מובנית — מזריקים כותרת חדשה
                edits.append((dm.end(), dm.end(), title_block(label, num)))

        for start, end, rep in sorted(edits, reverse=True):
            html = html[:start] + rep + html[end:]
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(html)

    # ---------- מעבר שני: שכתוב טקסט ההפניות בכל הקבצים ----------
    xref_re = re.compile(
        r'(<a href="[^"]*#([\w.-]+)" class="quarto-xref"[^>]*><span>)([^<]*)(</span></a>)')

    def fix_xref(m):
        target = m.group(2)
        if target not in ref_map:
            return m.group(0)
        label, num = ref_map[target]
        old = m.group(3)
        if re.fullmatch(r'[0-9]+(\.[0-9]+)*', old):          # מספר בלבד
            new = num
        elif re.fullmatch(r'[^0-9]+(?:&nbsp;|\s)[0-9.]+', old):  # תווית + מספר
            new = f'{label}&nbsp;{num}'
        else:
            return m.group(0)
        return m.group(1) + new + m.group(4)

    for path in chapter_files():
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
        new_html = xref_re.sub(fix_xref, html)
        if new_html != html:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new_html)

    print(f"renumber-envs: renumbered {len(ref_map)} referenced environments")

if __name__ == "__main__":
    sys.exit(main())
