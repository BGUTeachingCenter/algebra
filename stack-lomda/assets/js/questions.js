/*
 * questions.js — הגדרות השאלות.
 *
 * כאן מממשים מחדש את מה ש-STACK עושה בצד השרת:
 *   generate() : מגריל מופע חדש של השאלה (המשתנים האקראיים).
 *   text(p)    : מחזיר את טקסט השאלה (HTML עם LaTeX ב-\( \)) לפי המשתנים.
 *   inputs     : רשימת שדות התשובה.
 *   answers(p) : מחזיר את התשובות הנכונות לכל שדה (לבדיקה נומרית).
 *   solution(p): פתרון מלא מודרך.
 *
 * להוספת שאלה: מוסיפים אובייקט חדש למערך QUESTIONS באותו מבנה.
 * שלוש השאלות כאן נלקחו מתוך ייצוא ה-XHTML של Moodle.
 */
(function (global) {
  "use strict";

  // עזרי הגרלה
  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function nz(min, max) { var v = 0; while (v === 0) v = ri(min, max); return v; } // ללא אפס
  function vec(n, min, max) { var a = []; for (var i = 0; i < n; i++) a.push(nz(min, max)); return a; }

  // עזרי הצגה ב-LaTeX
  function col(v) { return "\\begin{pmatrix}" + v.join("\\\\") + "\\end{pmatrix}"; }
  function row(v) { return "(" + v.join(",\\ ") + ")"; }

  // מכפלה סקלרית, נורמה, מכפלה וקטורית
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]];
  }
  function scale(a, k) { return a.map(function (x) { return x * k; }); }
  function add(a, b) { return a.map(function (x, i) { return x + b[i]; }); }

  var QUESTIONS = [

    /* ---------- שאלה 1: חיבור וקטורים דו-מימדי (מקור: 9087352) ---------- */
    {
      id: "vec2d",
      title: "חיבור וקטורים וכפל בסקלר ב־\\(\\mathbb{R}^2\\)",
      generate: function () {
        return { v: vec(2, -5, 5), w: vec(2, -5, 5), a: nz(-3, 3), b: nz(-3, 3) };
      },
      text: function (p) {
        return "" +
          "<p>נתונים הווקטורים והסקלרים:</p>" +
          "<p class='math-ltr'>\\( V = " + col(p.v) + ",\\quad W = " + col(p.w) +
          ",\\quad a = " + p.a + ",\\quad b = " + p.b + " \\)</p>" +
          "<p>חשבו את הגדלים הבאים (אפשר לכתוב וקטור בצורה <code>3,5</code> או <code>(3,5)</code>):</p>";
      },
      inputs: [
        { name: "ans1", label: "\\( V + W = \\)", kind: "vector" },
        { name: "ans2", label: "\\( aV = \\)", kind: "vector" },
        { name: "ans3", label: "\\( aV + bW = \\)", kind: "vector" }
      ],
      answers: function (p) {
        return {
          ans1: add(p.v, p.w),
          ans2: scale(p.v, p.a),
          ans3: add(scale(p.v, p.a), scale(p.w, p.b))
        };
      },
      solution: function (p) {
        var s1 = add(p.v, p.w), s2 = scale(p.v, p.a), s3 = add(scale(p.v, p.a), scale(p.w, p.b));
        return "" +
          "<p>חיבור נעשה רכיב-רכיב:</p>" +
          "<p class='math-ltr'>\\( V+W = " + col(p.v) + "+" + col(p.w) + " = " + col(s1) + " \\)</p>" +
          "<p>כפל בסקלר מכפיל כל רכיב:</p>" +
          "<p class='math-ltr'>\\( aV = " + p.a + col(p.v) + " = " + col(s2) + " \\)</p>" +
          "<p>צירוף לינארי — משלבים את שתי הפעולות:</p>" +
          "<p class='math-ltr'>\\( aV+bW = " + col(s2) + "+" + col(scale(p.w, p.b)) + " = " + col(s3) + " \\)</p>";
      }
    },

    /* ---------- שאלה 2: מכפלה סקלרית ב־R^3 (מקור: 9087357) ---------- */
    {
      id: "dot3d",
      title: "מכפלה סקלרית, נורמה, זווית והטלה ב־\\(\\mathbb{R}^3\\)",
      generate: function () {
        return { v: vec(3, -4, 4), w: vec(3, -4, 4) };
      },
      text: function (p) {
        return "" +
          "<p>נתונים הווקטורים:</p>" +
          "<p class='math-ltr'>\\( v = " + col(p.v) + ",\\quad w = " + col(p.w) + " \\)</p>" +
          "<p>חשבו. בערכים אי-רציונליים אפשר לכתוב ביטוי כמו <code>sqrt(6)</code> " +
          "או ערך עשרוני מקורב:</p>";
      },
      inputs: [
        { name: "ans1", label: "\\( v \\cdot w = \\)", kind: "scalar" },
        { name: "ans2", label: "\\( \\lVert v \\rVert = \\)", kind: "scalar" },
        { name: "ans3", label: "\\( \\cos(\\varphi) = \\)", kind: "scalar" },
        { name: "ans4", label: "\\( \\mathrm{Pr}_{\\mathrm{span}(v)}(w) = \\)", kind: "vector" }
      ],
      answers: function (p) {
        var d = dot(p.v, p.w), nv = norm(p.v), nw = norm(p.w);
        return {
          ans1: d,
          ans2: nv,
          ans3: d / (nv * nw),
          ans4: scale(p.v, dot(p.w, p.v) / dot(p.v, p.v))
        };
      },
      solution: function (p) {
        var d = dot(p.v, p.w), nv = norm(p.v), nw = norm(p.w);
        var proj = scale(p.v, dot(p.w, p.v) / dot(p.v, p.v));
        var projStr = proj.map(function (x) { return Math.round(x * 1000) / 1000; });
        return "" +
          "<p><b>מכפלה סקלרית</b> — סכום מכפלות הרכיבים:</p>" +
          "<p class='math-ltr'>\\( v\\cdot w = " + p.v.map(function (x, i) { return "(" + x + ")(" + p.w[i] + ")"; }).join("+") + " = " + d + " \\)</p>" +
          "<p><b>נורמה</b>:</p>" +
          "<p class='math-ltr'>\\( \\lVert v\\rVert = \\sqrt{v\\cdot v} = \\sqrt{" + dot(p.v, p.v) + "} \\approx " + (Math.round(nv * 1000) / 1000) + " \\)</p>" +
          "<p><b>קוסינוס הזווית</b>:</p>" +
          "<p class='math-ltr'>\\( \\cos\\varphi = \\dfrac{v\\cdot w}{\\lVert v\\rVert\\,\\lVert w\\rVert} = \\dfrac{" + d + "}{\\sqrt{" + dot(p.v, p.v) + "}\\,\\sqrt{" + dot(p.w, p.w) + "}} \\approx " + (Math.round(d / (nv * nw) * 1000) / 1000) + " \\)</p>" +
          "<p><b>הטלה</b> על \\(\\mathrm{span}(v)\\) — כפולה של \\(v\\):</p>" +
          "<p class='math-ltr'>\\( \\mathrm{Pr}_{\\mathrm{span}(v)}(w) = \\dfrac{w\\cdot v}{v\\cdot v}\\,v = \\dfrac{" + dot(p.w, p.v) + "}{" + dot(p.v, p.v) + "}\\," + col(p.v) + " \\approx " + col(projStr) + " \\)</p>";
      }
    },

    /* ---------- שאלה 3: מכפלה וקטורית ושטח משולש (מקור: 9087807) ---------- */
    {
      id: "cross3d",
      title: "מכפלה וקטורית ושטח משולש",
      generate: function () {
        return { v: vec(3, -3, 3), w: vec(3, -3, 3) };
      },
      text: function (p) {
        return "" +
          "<p>עבור הווקטורים</p>" +
          "<p class='math-ltr'>\\( v = " + col(p.v) + ",\\quad w = " + col(p.w) + " \\)</p>" +
          "<p>מצאו את המכפלה הווקטורית, ואת שטח המשולש שקודקודיו " +
          "\\( (0,0,0),\\ " + row(p.v) + ",\\ " + row(p.w) + " \\):</p>";
      },
      inputs: [
        { name: "ans1", label: "\\( v \\times w = \\)", kind: "vector" },
        { name: "ans2", label: "\\( S = \\)", kind: "scalar" }
      ],
      answers: function (p) {
        var c = cross(p.v, p.w);
        return { ans1: c, ans2: norm(c) / 2 };
      },
      solution: function (p) {
        var c = cross(p.v, p.w), S = norm(c) / 2;
        return "" +
          "<p><b>מכפלה וקטורית</b> לפי הנוסחה:</p>" +
          "<p class='math-ltr'>\\( v\\times w = " + col([
            "v_2 w_3 - v_3 w_2",
            "v_3 w_1 - v_1 w_3",
            "v_1 w_2 - v_2 w_1"
          ]) + " = " + col(c) + " \\)</p>" +
          "<p><b>שטח המשולש</b> — חצי מאורך המכפלה הווקטורית:</p>" +
          "<p class='math-ltr'>\\( S = \\tfrac12\\,\\lVert v\\times w\\rVert = \\tfrac12\\sqrt{" + dot(c, c) + "} \\approx " + (Math.round(S * 1000) / 1000) + " \\)</p>";
      }
    }

  ];

  global.QUESTIONS = QUESTIONS;
})(window);
