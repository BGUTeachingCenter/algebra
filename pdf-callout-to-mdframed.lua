-- pdf-callout-to-mdframed.lua — ממיר callouts (פתרון/רמז וכו') למסגרות mdframed ב-PDF.
-- באתר הפתרונות כתובים כ- ::: {.callout-note title="פתרון"} (callout מתקפל של Quarto).
-- ברינדור PDF, Quarto עוטף callouts ב-tcolorbox — שאינו ממקם נכון תחת RTL (התיבה נשברת).
-- Quarto יוצר את ה-callout כ-node מיוחד; תופסים אותו דרך handler בשם Callout וממירים
-- ל-mdframed שתומך RTL. שים לב: c.content הוא Block יחיד, והכותרת יושבת ב-attr.attributes.
-- ב-HTML לא נטען (רק בפרופיל ה-PDF).

function Callout(c)
  if not quarto.doc.isFormat("pdf") then return nil end

  local title = ""
  if c.attr and c.attr.attributes then
    title = c.attr.attributes["title"] or ""
  end
  if title == "" and c.title then title = pandoc.utils.stringify(c.title) end
  if title == "" then title = "פתרון" end

  -- pandoc.Blocks מנרמל את c.content בין אם הוא Block יחיד ובין אם רשימת בלוקים
  local out = pandoc.Blocks({})
  out:insert(pandoc.RawBlock("latex",
    "\\begin{mdframed}[linecolor=black!55,backgroundcolor=black!4,linewidth=0.5pt," ..
    "leftmargin=0pt,rightmargin=0pt,innerleftmargin=8pt,innerrightmargin=8pt," ..
    "innertopmargin=6pt,innerbottommargin=6pt,skipabove=10pt,skipbelow=10pt]"))
  out:insert(pandoc.Para({ pandoc.Strong({ pandoc.Str(title) }) }))
  out:extend(pandoc.Blocks(c.content))  -- משטח לרשימת בלוקים תקינה
  out:insert(pandoc.RawBlock("latex", "\\end{mdframed}"))
  -- handler של Callout דורש Block/Blocks — Div שקוף העוטף רשימת בלוקים שטוחה
  return pandoc.Div(out)
end
