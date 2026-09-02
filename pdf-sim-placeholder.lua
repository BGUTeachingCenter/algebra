-- pdf-sim-placeholder.lua — טיפול בסימולציות האינטראקטיביות בהדפסת PDF.
-- באתר הסימולציות מוטמעות כ- ![](simulations/NAME.html?embed=1) (iframe אינטראקטיבי).
-- ל-PDF אין מקבילה אינטראקטיבית, ולכן:
--   1. אם קיים קובץ simulations/NAME.png — משתמשים בו כתמונה סטטית.
--   2. אחרת — מחליפים בתיבה עם שם הסימולציה והפניה לגרסה המקוונת.
-- ב-HTML הפילטר לא עושה דבר (ההטמעה נשארת אינטראקטיבית).

local function file_exists(path)
  local f = io.open(path, "r")
  if f then f:close() return true end
  return false
end

function Image(img)
  if not quarto.doc.isFormat("pdf") then return nil end
  local name = (img.src or ""):match("simulations/([%w%-_]+)%.html")
  if not name then return nil end

  local png = "simulations/" .. name .. ".png"
  if file_exists(png) then
    img.src = png
    return img
  end

  local cap = pandoc.utils.stringify(img.caption or {})
  if cap == "" then cap = "סימולציה אינטראקטיבית" end
  local latex = "\\begin{center}\\fbox{\\parbox{0.82\\linewidth}{\\centering "
    .. "\\textbf{סימולציה אינטראקטיבית}\\\\[2pt] " .. cap
    .. "\\\\[2pt] \\small(זמינה בגרסה המקוונת של הספר)}}\\end{center}"
  return pandoc.RawInline('latex', latex)
end
