/*
 * app.js — הבקר של הלומדה.
 * בונה כרטיס לכל שאלה, מטפל בבדיקה / פתרון / הגרלה מחדש, מדווח ציון ל-SCORM.
 */
(function () {
  "use strict";

  var state = {};   // מצב לכל שאלה: { params, solved }
  var solved = {};  // אילו שאלות נפתרו נכון (למעקב ציון)

  function typeset(el) {
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetClear && MathJax.typesetClear([el]);
      MathJax.typesetPromise([el]).catch(function () {});
    }
  }

  // בונה מופע חדש של שאלה ומצייר אותו בכרטיס
  function renderQuestion(q, card) {
    var p = q.generate();
    state[q.id] = { params: p, correct: q.answers(p) };

    var body = card.querySelector(".q-body");
    var inputsHtml = q.inputs.map(function (inp) {
      return "" +
        "<div class='field' data-name='" + inp.name + "'>" +
          "<label>" + inp.label + "</label>" +
          "<input type='text' autocomplete='off' inputmode='text' " +
                 "data-name='" + inp.name + "' data-kind='" + inp.kind + "' />" +
          "<span class='mark' aria-hidden='true'></span>" +
        "</div>";
    }).join("");

    body.innerHTML =
      "<div class='q-text'>" + q.text(p) + "</div>" +
      "<div class='fields'>" + inputsHtml + "</div>" +
      "<div class='q-feedback' role='status'></div>" +
      "<div class='q-solution' hidden></div>";

    card.querySelector(".btn-solution").textContent = "הצג פתרון";
    card.querySelector(".q-solution").hidden = true;
    typeset(body);
  }

  function checkQuestion(q, card) {
    var st = state[q.id];
    var fields = card.querySelectorAll(".field");
    var allOk = true, anyFilled = false;

    fields.forEach(function (field) {
      var input = field.querySelector("input");
      var name = input.getAttribute("data-name");
      var kind = input.getAttribute("data-kind");
      var mark = field.querySelector(".mark");
      var expected = st.correct[name];
      var res = (kind === "vector")
        ? Parse.checkVector(input.value, expected)
        : Parse.checkScalar(input.value, expected);

      field.classList.remove("ok", "bad", "empty");
      if (input.value.trim() !== "") anyFilled = true;

      if (res.reason === "empty") {
        field.classList.add("empty"); mark.textContent = ""; allOk = false;
      } else if (res.ok) {
        field.classList.add("ok"); mark.textContent = "✓";
      } else {
        field.classList.add("bad"); mark.textContent = "✗"; allOk = false;
      }
    });

    var fb = card.querySelector(".q-feedback");
    if (!anyFilled) {
      fb.textContent = "מלאו לפחות שדה אחד ואז לחצו בדיקה.";
      fb.className = "q-feedback neutral";
    } else if (allOk) {
      fb.textContent = "כל הכבוד! כל התשובות נכונות.";
      fb.className = "q-feedback good";
      solved[q.id] = true;
      updateScore();
    } else {
      fb.textContent = "יש תשובות שגויות (מסומנות ב־✗). אפשר לתקן ולבדוק שוב, או להציג פתרון.";
      fb.className = "q-feedback bad";
    }
  }

  function showSolution(q, card) {
    var st = state[q.id];
    var sol = card.querySelector(".q-solution");
    var btn = card.querySelector(".btn-solution");
    if (sol.hidden) {
      sol.innerHTML = q.solution(st.params);
      sol.hidden = false;
      btn.textContent = "הסתר פתרון";
      typeset(sol);
    } else {
      sol.hidden = true;
      btn.textContent = "הצג פתרון";
    }
  }

  function updateScore() {
    var total = QUESTIONS.length;
    var count = Object.keys(solved).length;
    var pct = Math.round((count / total) * 100);
    var badge = document.getElementById("score-badge");
    if (badge) badge.textContent = "נפתרו " + count + " מתוך " + total;

    if (window.SCORM) {
      SCORM.setScore(pct);
      SCORM.setStatus(count === total ? "completed" : "incomplete");
      SCORM.saveSuspend(Object.keys(solved).join(","));
    }
  }

  function build() {
    var root = document.getElementById("questions");

    QUESTIONS.forEach(function (q, idx) {
      var card = document.createElement("section");
      card.className = "question-card";
      card.innerHTML =
        "<header class='q-head'>" +
          "<span class='q-num'>שאלה " + (idx + 1) + "</span>" +
          "<h2>" + q.title + "</h2>" +
        "</header>" +
        "<div class='q-body'></div>" +
        "<div class='q-actions'>" +
          "<button class='btn btn-check'>בדיקה</button>" +
          "<button class='btn btn-solution'>הצג פתרון</button>" +
          "<button class='btn btn-new'>שאלה חדשה</button>" +
        "</div>";
      root.appendChild(card);

      renderQuestion(q, card);
      typeset(card.querySelector("h2"));

      card.querySelector(".btn-check").addEventListener("click", function () { checkQuestion(q, card); });
      card.querySelector(".btn-solution").addEventListener("click", function () { showSolution(q, card); });
      card.querySelector(".btn-new").addEventListener("click", function () {
        delete solved[q.id];
        renderQuestion(q, card);
        card.querySelector(".q-feedback") && (card.querySelector(".q-feedback").textContent = "");
        updateScore();
      });

      // Enter בשדה = בדיקה
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); checkQuestion(q, card); }
      });
    });

    updateScore();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.SCORM) SCORM.init();
    build();
  });
})();
