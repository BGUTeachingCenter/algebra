#!/usr/bin/env bash
# build.sh — אורז את הלומדה לחבילת SCORM שאפשר להעלות ל-Moodle.
# הפלט: dist/stack-lomda-scorm.zip  (החבילה = הקבצים, כש-imsmanifest.xml בשורש ה-zip)
set -euo pipefail
cd "$(dirname "$0")"

OUT="dist/stack-lomda-scorm.zip"
mkdir -p dist
rm -f "$OUT"

# חשוב: ה-zip חייב להכיל את imsmanifest.xml בשורש (לא בתוך תת-תיקייה).
zip -r "$OUT" \
    imsmanifest.xml \
    index.html \
    assets \
    -x '*.DS_Store'

echo "נוצרה חבילת SCORM: $OUT"
echo "העלו אותה ב-Moodle: הוספת פעילות → חבילת SCORM → העלאת ה-zip."
