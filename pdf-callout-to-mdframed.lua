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

  local out = pandoc.List()
  out:insert(pandoc.RawBlock("latex",
    "\\begin{mdframed}[linecolor=black!55,backgroundcolor=black!4,linewidth=0.5pt," ..
    "leftmargin=0pt,rightmargin=0pt,innerleftmargin=8pt,innerrightmargin=8pt," ..
    "innertopmargin=6pt,innerbottommargin=6pt,skipabove=10pt,skipbelow=10pt]"))
  out:insert(pandoc.Para({ pandoc.Strong({ pandoc.Str(title) }) }))
  out:insert(c.content)  -- Block יחיד (בדרך כלל Div העוטף את גוף ה-callout)
  out:insert(pandoc.RawBlock("latex", "\\end{mdframed}"))
  return out
end
