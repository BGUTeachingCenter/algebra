#!/usr/bin/env python3

import sys
from pathlib import Path

# Unicode bidi isolation characters
RLI = "\u2067"   # Right-to-Left Isolate
PDI = "\u2069"   # Pop Directional Isolate


def has_hebrew(s):
    return any("\u0590" <= ch <= "\u05ff" for ch in s)


def find_matching_brace(text, start):
    """start points immediately after the opening {"""
    depth = 1
    i = start

    while i < len(text):
        if text[i] == "\\":
            i += 2
            continue

        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return i

        i += 1

    return None


def split_math_and_text(content):
    """
    Split content such as:
        $T$ חח״ע
    or:
        אם $T$ הפיכה

    into alternating text/math pieces.
    """
    parts = []
    i = 0
    start = 0

    while i < len(content):
        if content[i] == "$":
            if i > start:
                parts.append(("text", content[start:i]))

            j = i + 1
            while j < len(content):
                if content[j] == "$" and content[j - 1] != "\\":
                    break
                j += 1

            if j >= len(content):
                # unmatched $, leave the whole content unchanged
                return None

            parts.append(("math", content[i + 1:j]))
            i = j + 1
            start = i
        else:
            i += 1

    if start < len(content):
        parts.append(("text", content[start:]))

    return parts


def rtl_text(s):
    s = s.strip()

    if not s:
        return ""

    # Already processed
    if s.startswith(RLI) and s.endswith(PDI):
        return r"\text{" + s + "}"

    return r"\text{" + RLI + s + PDI + "}"


def fix_text_content(content):
    if not has_hebrew(content):
        return None

    parts = split_math_and_text(content)

    # No embedded $...$: only fix direction of Hebrew text
    if parts is None or not any(kind == "math" for kind, _ in parts):
        stripped = content.strip()

        if stripped.startswith(RLI) and stripped.endswith(PDI):
            return None

        return RLI + content + PDI

    # The content is logically RTL.
    # Reverse its top-level text/math pieces for embedding in LTR mathematics.
    output = []

    for kind, value in reversed(parts):
        if kind == "math":
            value = value.strip()
            if value:
                output.append(value)
        else:
            if value.strip():
                output.append(rtl_text(value))

    return r"\;".join(output)


def process_html(text):
    result = []
    pos = 0
    changed = 0
    marker = r"\text{"

    while True:
        idx = text.find(marker, pos)

        if idx == -1:
            result.append(text[pos:])
            break

        result.append(text[pos:idx])

        content_start = idx + len(marker)
        content_end = find_matching_brace(text, content_start)

        if content_end is None:
            result.append(text[idx:])
            break

        content = text[content_start:content_end]
        replacement = fix_text_content(content)

        if replacement is None:
            result.append(text[idx:content_end + 1])
        else:
            # If replacement already contains \text{...}, don't wrap again
            if replacement.startswith(r"\text{"):
                result.append(replacement)
            else:
                result.append(r"\text{" + replacement + "}")
            changed += 1

        pos = content_end + 1

    return "".join(result), changed


def html_files(paths):
    for p in paths:
        p = Path(p)

        if p.is_file() and p.suffix.lower() == ".html":
            yield p

        elif p.is_dir():
            yield from p.rglob("*.html")


def main():
    args = sys.argv[1:]
    check = "--check" in args
    paths = [a for a in args if not a.startswith("--")]

    if not paths:
        paths = ["_book"]

    total = 0

    for filename in html_files(paths):
        src = filename.read_text(encoding="utf-8")
        out, changed = process_html(src)

        if changed:
            total += changed
            print(f"{filename}: fixed {changed} RTL math text occurrence(s)")

            if not check:
                filename.write_text(out, encoding="utf-8")

    suffix = " (check only, nothing written)" if check else ""
    print(f"TOTAL RTL math fixes: {total}{suffix}")


if __name__ == "__main__":
    main()