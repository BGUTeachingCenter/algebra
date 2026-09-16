/*
 * parse.js — פרסור והשוואה של תשובות התלמיד.
 *
 * זה החלק שמחליף את "answer tests" של STACK (שרצים על Maxima בצד השרת).
 * הרעיון: מנתחים את הקלט של התלמיד למספר או לוקטור, ומשווים נומרית
 * לתשובה הנכונה עם סובלנות (tolerance). כך תשובות שקולות מתקבלות:
 *   "1/2"  ==  "0.5"
 *   "sqrt(8)" == "2*sqrt(2)"
 *   "(3, 5)" == "3,5" == "[3;5]"
 *
 * נשען על math.js (mathjs) לפרסור ביטויים. אם math.js לא נטען, יש נפילה
 * מבוקרת ל-eval פשוט של מספרים/שברים בלבד.
 */
(function (global) {
  "use strict";

  var TOL = 1e-6; // סובלנות מוחלטת בסיסית

  function hasMath() {
    return typeof global.math !== "undefined" && typeof global.math.evaluate === "function";
  }

  // הערכת ביטוי סקלרי בודד -> מספר, או null אם נכשל.
  function evalScalar(str) {
    if (str == null) return null;
    var s = String(str).trim();
    if (s === "") return null;
    // המרות נפוצות שתלמידים כותבים
    s = s.replace(/√/g, "sqrt")      // סימן שורש
         .replace(/π/g, "pi")         // π
         .replace(/,/g, ".");              // פסיק עשרוני (זהירות: לא בוקטורים — שם מפרקים קודם)
    try {
      var v;
      if (hasMath()) {
        v = global.math.evaluate(s);
      } else {
        // נפילה: מתירים רק ספרות, נקודה, סימנים, סוגריים, לוכסן
        if (!/^[-+*/().\d\s]+$/.test(s)) return null;
        v = Function('"use strict";return (' + s + ')')();
      }
      if (typeof v === "number" && isFinite(v)) return v;
      if (v && typeof v.re === "number") return v.re; // מספר מרוכב — נחזיר חלק ממשי
      return null;
    } catch (e) {
      return null;
    }
  }

  // פרסור וקטור -> מערך מספרים, או null אם נכשל.
  // מקבל: "3,5" | "(3, 5)" | "[3;5]" | "3 5" | "<3,5>"
  function evalVector(str) {
    if (str == null) return null;
    var s = String(str).trim();
    if (s === "") return null;
    // הסרת עוטפים חיצוניים בלבד
    s = s.replace(/^[\[\](){}<>|]+/, "").replace(/[\[\](){}<>|]+$/, "").trim();
    // מפרידים: פסיק, נקודה-פסיק, או רווחים
    var parts = s.split(/[;,]|\s+/).map(function (x) { return x.trim(); }).filter(function (x) { return x !== ""; });
    if (parts.length === 0) return null;
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      // כאן אסור להמיר פסיק לנקודה (כבר פיצלנו); ננקה רק שורש/pi
      var t = parts[i].replace(/√/g, "sqrt").replace(/π/g, "pi");
      var n;
      try {
        n = hasMath() ? global.math.evaluate(t)
                      : Function('"use strict";return (' + t + ')')();
      } catch (e) { return null; }
      if (typeof n !== "number" || !isFinite(n)) {
        if (n && typeof n.re === "number") n = n.re; else return null;
      }
      out.push(n);
    }
    return out;
  }

  function closeEnough(a, b) {
    var scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= TOL * scale;
  }

  // בדיקת תשובה סקלרית מול ערך צפוי
  function checkScalar(input, expected) {
    var v = evalScalar(input);
    if (v === null) return { ok: false, reason: "empty" };
    return { ok: closeEnough(v, expected), reason: "value", value: v };
  }

  // בדיקת תשובה וקטורית מול מערך צפוי
  function checkVector(input, expected) {
    var v = evalVector(input);
    if (v === null) return { ok: false, reason: "empty" };
    if (v.length !== expected.length) return { ok: false, reason: "dim", value: v };
    for (var i = 0; i < expected.length; i++) {
      if (!closeEnough(v[i], expected[i])) return { ok: false, reason: "value", value: v };
    }
    return { ok: true, reason: "value", value: v };
  }

  global.Parse = {
    evalScalar: evalScalar,
    evalVector: evalVector,
    checkScalar: checkScalar,
    checkVector: checkVector,
    setTolerance: function (t) { TOL = t; }
  };
})(window);
