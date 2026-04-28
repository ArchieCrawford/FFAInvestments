"""
Fix the 'Date of Deposit' column in the Argent deposit CSV by reading the
real Date header from each .eml inside argentdeposit.zip.

Match key: confirmation number (extracted from the email body).

Usage:
    python scripts/fix-deposit-dates.py

Inputs:
    Deposits/argentdeposit.zip
    Deposits/Deposit Dates Added to Emails - Deposit Dates Added to Emails.csv

Output:
    Deposits/deposits_fixed.csv
"""

from __future__ import annotations

import csv
import email
import re
import sys
import zipfile
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT / "Deposits" / "argentdeposit.zip"
CSV_PATH = ROOT / "Deposits" / "Deposit Dates Added to Emails - Deposit Dates Added to Emails.csv"
OUT_PATH = ROOT / "Deposits" / "deposits_fixed.csv"

CONFIRM_RE = re.compile(r"confirmation\s*number\s*([0-9]+)", re.IGNORECASE)
AMOUNT_RE = re.compile(r"\$([\d,]+\.\d{2})")
SENDER_RE = re.compile(r"payment\s+from\s+([^()]+?)\s*\(confirmation", re.IGNORECASE)


def get_email_text(msg: email.message.Message) -> str:
    parts = []
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_maintype() == "text":
                try:
                    parts.append(part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8", errors="ignore"))
                except Exception:
                    pass
    else:
        try:
            parts.append(msg.get_payload(decode=True).decode(
                msg.get_content_charset() or "utf-8", errors="ignore"))
        except Exception:
            pass
    raw = "\n".join(parts)
    # strip tags
    raw = re.sub(r"<style[^>]*>.*?</style>", " ", raw, flags=re.DOTALL | re.IGNORECASE)
    raw = re.sub(r"<head[^>]*>.*?</head>", " ", raw, flags=re.DOTALL | re.IGNORECASE)
    raw = re.sub(r"<[^>]+>", " ", raw)
    raw = re.sub(r"&nbsp;", " ", raw)
    raw = re.sub(r"\s+", " ", raw)
    return raw


def parse_eml(raw_bytes: bytes) -> dict | None:
    msg = email.message_from_bytes(raw_bytes)
    date_hdr = msg.get("Date")
    if not date_hdr:
        return None
    try:
        dt = parsedate_to_datetime(date_hdr)
    except Exception:
        return None

    text = get_email_text(msg)
    cm = CONFIRM_RE.search(text)
    am = AMOUNT_RE.search(text)
    sm = SENDER_RE.search(text)
    if not cm:
        return None
    return {
        "confirmation": cm.group(1).strip(),
        "amount": am.group(1) if am else None,
        "sender": sm.group(1).strip() if sm else None,
        "date_iso": dt.date().isoformat(),
        "datetime_iso": dt.isoformat(),
    }


def main() -> int:
    if not ZIP_PATH.exists():
        print(f"ERROR: missing {ZIP_PATH}", file=sys.stderr)
        return 1
    if not CSV_PATH.exists():
        print(f"ERROR: missing {CSV_PATH}", file=sys.stderr)
        return 1

    by_conf: dict[str, dict] = {}
    with zipfile.ZipFile(ZIP_PATH) as z:
        for name in z.namelist():
            if not name.lower().endswith(".eml"):
                continue
            data = z.read(name)
            parsed = parse_eml(data)
            if parsed:
                by_conf[parsed["confirmation"]] = parsed

    print(f"Parsed {len(by_conf)} emails from zip")

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    extra = ["Deposit Date (ISO)", "Deposit DateTime (ISO)"]
    out_fields = list(fieldnames) + [c for c in extra if c not in fieldnames]

    matched = 0
    unmatched: list[str] = []
    for row in rows:
        conf = (row.get("Confirmation #") or "").strip()
        info = by_conf.get(conf)
        if info:
            matched += 1
            row["Date of Deposit"] = info["date_iso"]
            row["Deposit Date (ISO)"] = info["date_iso"]
            row["Deposit DateTime (ISO)"] = info["datetime_iso"]
        else:
            unmatched.append(conf)
            row.setdefault("Deposit Date (ISO)", "")
            row.setdefault("Deposit DateTime (ISO)", "")

    with OUT_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Matched {matched}/{len(rows)} rows by confirmation number")
    if unmatched:
        print(f"Unmatched confirmations ({len(unmatched)}): {unmatched}")
    print(f"Wrote: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
