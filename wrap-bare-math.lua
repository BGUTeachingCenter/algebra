-- wrap-bare-math.lua — עוטף סביבות מתמטיקה של AMS שנכתבו במקור בלי $$ עוטף.
-- בקוד המקור יש בלוקים כמו:
--     \begin{aligned} ... \end{aligned}
-- ללא $$ מסביב. MathJax (HTML) מרנדר סביבות AMS אוטומטית, אבל pandoc מעביר אותן
-- כ-LaTeX גולמי, וב-PDF הן נכשלות ("aligned allowed only in math mode").
-- הפילטר תופס את ה-RawBlock שנוצר ועוטף ב-\[ ... \]. פועל ל-PDF בלבד; אינו נוגע במקור.

local MATH_ENVS = {
  aligned = true, alignedat = true, gathered = true,
  -- (align/gather/equation הן כבר display ואינן דורשות עטיפה, ולכן לא נכללות)
}

function RawBlock(el)
  if not quarto.doc.isFormat("pdf") then return nil end
  if el.format ~= "tex" and el.format ~= "latex" then return nil end
  local env = el.text:match("^%s*\\begin%{([%a]+)%*?%}")
  if env and MATH_ENVS[env] then
    -- מסירים שורות רווח-בלבד: שורה ריקה בתוך math mode = \par ואסורה ("Missing $")
    local cleaned = {}
    for line in (el.text .. "\n"):gmatch("(.-)\n") do
      if line:match("%S") then cleaned[#cleaned + 1] = line end
    end
    return pandoc.RawBlock("latex", "\\[\n" .. table.concat(cleaned, "\n") .. "\n\\]")
  end
  return nil
end
