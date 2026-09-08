# משימות פתוחות — גרסת ה-PDF

## 🔴 תמונות סימולציה חסרות ל-PDF

בגרסת ה-PDF כל סימולציה אינטראקטיבית (`simulations/NAME.html`) מוחלפת בתמונה סטטית
מתוך תיקיית `images/` (לפי הפילטר `pdf-sim-placeholder.lua`). לסימולציה שאין לה תמונה
מופיעה במקום תיבת placeholder ("סימולציה אינטראקטיבית — זמינה בגרסה המקוונת").

- [ ] **DetOperations** — צריך לייצר תמונה תחליפית. **כרגע אין תמונה ל-PDF** עבור
  הסימולציה `simulations/DetOperations.html`, ולכן היא מופיעה בהדפסה כתיבת placeholder.
  יש לייצא/לצלם את הסימולציה ולשמור אותה בשם **`images/DetOperations.png`**.
  (כנראה נשכחה בייצוא מ-Overleaf.)

- [ ] **Rotation** — לאמת. אין `images/Rotation.png`, ולכן היא ממופה כרגע (בניחוש) ל-
  `images/RotationPi.png` בטבלת ה-ALIAS שבתוך `pdf-sim-placeholder.lua`. אם זו לא התמונה
  הנכונה — להוסיף `images/Rotation.png` ולהסיר את שורת ה-ALIAS.

**איך משלימים:** לשמור את התמונה ב-`images/` בשם הזהה לסימולציה (למשל `images/DetOperations.png`);
הפילטר יקלוט אותה אוטומטית בלי שינוי קוד. בדיקה: `quarto render --profile pdf --to pdf`.

## 🟡 שיפורים אפשריים (לא חוסמים)

- [ ] תוכן העניינים ב-PDF: עמודת המספרים אינה ממוראה לגמרי ל-RTL (קוסמטי).
- [ ] לשקול חיווט בניית ה-PDF ל-CI (כרגע ה-deploy בונה רק HTML).
