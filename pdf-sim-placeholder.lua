-- pdf-sim-placeholder.lua — טיפול בסימולציות האינטראקטיביות בהדפסת PDF.
-- באתר הסימולציות מוטמעות כ- ![](simulations/NAME.html?embed=1) (iframe אינטראקטיבי).
-- ל-PDF אין מקבילה אינטראקטיבית, ולכן ממירים כל סימולציה בתמונה סטטית מקבילה מתוך
-- תיקיית images/ (בעלת אותו שם, או שם קרוב לפי הטבלה למטה). אם אין תמונה — תיבה עם הפניה למקוון.
-- ב-HTML הפילטר לא עושה דבר (ההטמעה נשארת אינטראקטיבית).

-- כינויים לסימולציות ששם קובץ התמונה שלהן שונה משם הסימולציה:
local ALIAS = {
  ["Axis-of-Rotation"]         = "AxisRotation",
  ["Infinite-Planes"]          = "InfinitePlanes",
  ["Line-Motion"]              = "LineMotion",
  ["Plane-Spanned-by-Vectors"] = "PlaneVectors",
  ["Plane-and-Line"]           = "PlaneLine",
  ["Point-Vector"]             = "PointVector",
  ["Rotating-Line"]            = "RotatingLine",
  ["Rotation"]                 = "RotationPi",
  ["Scalar-Slider"]            = "ScalarSlider",
  ["Vector-Twins"]             = "VectorTwins",
  ["two-lines"]                = "TwoLines",
}
local EXTS = { "png", "jpg", "jpeg", "svg" }

local function file_exists(path)
  local f = io.open(path, "r")
  if f then f:close() return true end
  return false
end

-- מחזיר את נתיב התמונה המקבילה ב-images/ אם קיימת, אחרת nil
local function find_image(name)
  local candidates = {}
  if ALIAS[name] then candidates[#candidates + 1] = ALIAS[name] end
  candidates[#candidates + 1] = name                  -- שם זהה
  candidates[#candidates + 1] = name:gsub("%-", "")    -- ללא מקפים
  for _, base in ipairs(candidates) do
    for _, ext in ipairs(EXTS) do
      local p = "images/" .. base .. "." .. ext
      if file_exists(p) then return p end
    end
  end
  return nil
end

function Image(img)
  if not quarto.doc.isFormat("pdf") then return nil end
  local name = (img.src or ""):match("simulations/([%w%-_]+)%.html")
  if not name then return nil end

  local imgpath = find_image(name)
  if imgpath then
    img.src = imgpath
    return img
  end

  local cap = pandoc.utils.stringify(img.caption or {})
  if cap == "" then cap = "סימולציה אינטראקטיבית" end
  local latex = "\\begin{center}\\fbox{\\parbox{0.82\\linewidth}{\\centering "
    .. "\\textbf{סימולציה אינטראקטיבית}\\\\[2pt] " .. cap
    .. "\\\\[2pt] \\small(זמינה בגרסה המקוונת של הספר)}}\\end{center}"
  return pandoc.RawInline('latex', latex)
end
