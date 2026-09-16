/*
 * scorm.js — מעטפת דקה ל-SCORM 1.2.
 *
 * מטרתה לדבר עם ה-LMS (Moodle) לצורך מעקב: התחלה, סימון השלמה, ציון, ושמירה.
 * אם אין LMS (למשל כשפותחים את index.html ישירות מהדיסק) — כל הפעולות
 * הופכות ל-no-op שקט, כך שהלומדה עדיין עובדת לבדיקות מקומיות.
 *
 * SCORM 1.2 נבחר במכוון: הוא הנתמך ביותר והכי יציב ב-Moodle.
 */
(function (global) {
  "use strict";

  var api = null;        // אובייקט ה-API של ה-LMS, אם נמצא
  var initialized = false;

  // חיפוש אובייקט ה-API בשרשרת החלונות (הורים ו-opener), כמקובל ב-SCORM 1.2.
  function findAPI(win) {
    var tries = 0;
    while (win && win.API == null && win.parent && win.parent !== win && tries < 15) {
      tries++;
      win = win.parent;
    }
    return win ? win.API : null;
  }

  function locateAPI() {
    var found = findAPI(window);
    if (!found && window.opener) found = findAPI(window.opener);
    return found;
  }

  var SCORM = {
    // true אם אנחנו רצים בתוך LMS אמיתי
    available: function () { return api != null; },

    init: function () {
      if (initialized) return true;
      api = locateAPI();
      if (!api) {
        console.info("[SCORM] לא נמצא LMS — רץ במצב עצמאי (ללא מעקב).");
        return false;
      }
      var ok = api.LMSInitialize("") === "true";
      initialized = ok;
      if (ok) {
        // אם הסטטוס עדיין 'not attempted' נסמן שהתחלנו.
        var status = api.LMSGetValue("cmi.core.lesson_status");
        if (!status || status === "not attempted") {
          api.LMSSetValue("cmi.core.lesson_status", "incomplete");
        }
        api.LMSCommit("");
      }
      return ok;
    },

    // ציון באחוזים (0..100)
    setScore: function (percent) {
      if (!api) return;
      var p = Math.max(0, Math.min(100, Math.round(percent)));
      api.LMSSetValue("cmi.core.score.raw", String(p));
      api.LMSSetValue("cmi.core.score.min", "0");
      api.LMSSetValue("cmi.core.score.max", "100");
      api.LMSCommit("");
    },

    // "completed" / "incomplete" / "passed" / "failed"
    setStatus: function (status) {
      if (!api) return;
      api.LMSSetValue("cmi.core.lesson_status", status);
      api.LMSCommit("");
    },

    // שמירת מחרוזת חופשית (למשל אילו שאלות נפתרו) לשחזור בכניסה הבאה
    saveSuspend: function (str) {
      if (!api) return;
      try { api.LMSSetValue("cmi.suspend_data", str); api.LMSCommit(""); }
      catch (e) { /* התעלמות */ }
    },

    loadSuspend: function () {
      if (!api) return "";
      try { return api.LMSGetValue("cmi.suspend_data") || ""; }
      catch (e) { return ""; }
    },

    finish: function () {
      if (!api || !initialized) return;
      api.LMSCommit("");
      api.LMSFinish("");
      initialized = false;
    }
  };

  // סגירה נקייה כשעוזבים את הדף
  global.addEventListener("beforeunload", function () { SCORM.finish(); });

  global.SCORM = SCORM;
})(window);
