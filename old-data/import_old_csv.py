#!/usr/bin/env python3
"""Import legacy membership CSV data into the new SQLite schema.

Usage:
  python database/import_old_csv.py \
    --db database/membership.db \
    --csv database/old.csv

Notes:
- This script is standalone and does not touch application runtime code.
- It expects the target DB to already contain the schema from database/main.sql.
- Existing rows are updated (upsert behavior) by primary key / unique key.
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import os
import secrets
import sqlite3
from dataclasses import dataclass
from typing import Any


PBKDF2_ITERATIONS = 10000
PBKDF2_HASH_LENGTH = 32


@dataclass
class ImportStats:
    total_rows: int = 0
    imported_rows: int = 0
    skipped_rows: int = 0
    failed_rows: int = 0


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def hash_password(plain_password: str) -> str:
    salt = secrets.token_bytes(16)
    hash_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
        dklen=PBKDF2_HASH_LENGTH,
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${b64(salt)}${b64(hash_bytes)}"


def clean(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def get_value(row: dict[str, str], *candidate_headers: str) -> str | None:
    # Try exact-match headers first.
    for header in candidate_headers:
        if header in row:
            return clean(row.get(header))

    # Fallback: best-effort match by normalized header text.
    normalized_row_keys = {" ".join(k.split()): k for k in row.keys()}
    for header in candidate_headers:
        normalized = " ".join(header.split())
        if normalized in normalized_row_keys:
            return clean(row.get(normalized_row_keys[normalized]))

    # Final fallback: substring match for known long headers.
    for key in row.keys():
        if "هل يمكنك ذكر اسمين" in key and "تجمع إبتكار" in key:
            if any("هل يمكنك ذكر اسمين" in header for header in candidate_headers):
                return clean(row.get(key))

    return None


def clean_phone(value: str | None) -> str | None:
    value = clean(value)
    if value is None:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    if not digits:
        return value
    if value.startswith("+"):
        return f"+{digits}"
    return f"+{digits}"


def normalize_blood_type(value: str | None) -> str | None:
    value = clean(value)
    if value is None:
        return None

    normalized = (
        value.replace("(", "")
        .replace(")", "")
        .replace(" ", "")
        .replace("＋", "+")
        .replace("－", "-")
        .upper()
    )

    allowed = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
    if normalized in allowed:
        return normalized
    return None


def normalize_sex(value: str | None) -> str | None:
    value = clean(value)
    if value is None:
        return None
    lowered = value.lower()
    if lowered in {"male", "m", "ذكر"}:
        return "male"
    if lowered in {"female", "f", "أنثى"}:
        return "female"
    return None


def normalize_country(_value: str | None) -> str | None:
    # Legacy dataset is Turkey-based; keep a consistent ISO code.
    return "TR"


def parse_graduation_year(value: str | None) -> int | None:
    value = clean(value)
    if value is None:
        return None
    if len(value) == 4 and value.isdigit():
        year = int(value)
        if 1900 <= year <= 2100:
            return year
    return None


def map_volunteering(value: str | None) -> str | None:
    value = clean(value)
    if value is None:
        return None
    lowered = value.lower()
    if lowered in {"نعم", "yes", "y", "1", "true"}:
        return "yes"
    if lowered in {"لا", "no", "n", "0", "false"}:
        return "no"
    return value


def read_csv_rows(csv_path: str) -> list[dict[str, str]]:
    last_error: Exception | None = None
    for encoding in ("utf-8-sig", "utf-8", "cp1256"):
        try:
            with open(csv_path, "r", encoding=encoding, newline="") as file_obj:
                return list(csv.DictReader(file_obj))
        except Exception as exc:  # pragma: no cover - fallback path
            last_error = exc
    raise RuntimeError(f"Unable to read CSV file: {csv_path}") from last_error


def upsert_row(conn: sqlite3.Connection, row: dict[str, str]) -> None:
    membership_number = get_value(row, "رقم العضوية")
    email = get_value(row, "البريد الإلكتروني")
    password_plain = get_value(row, "password")

    if not membership_number:
        raise ValueError("Missing membership number")
    if not email:
        raise ValueError("Missing email")
    if not password_plain:
        raise ValueError("Missing password")

    password_hash = hash_password(password_plain)

    user_sql = """
    INSERT INTO users (membership_number, email, password_hash, role)
    VALUES (?, ?, ?, 'member')
    ON CONFLICT(membership_number) DO UPDATE SET
      email = excluded.email,
      password_hash = excluded.password_hash,
      updated_at = datetime('now')
    """

    user_info_sql = """
    INSERT INTO user_info (
      membership_number,
      en_name,
      ar_name,
      phone_number,
      sex,
      date_of_birth,
      country,
      region,
      city,
      education_level,
      school,
      field_of_study,
      graduation_year,
      blood_type,
      telegram_id,
      telegram_username
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(membership_number) DO UPDATE SET
      en_name = excluded.en_name,
      ar_name = excluded.ar_name,
      phone_number = excluded.phone_number,
      sex = excluded.sex,
      date_of_birth = excluded.date_of_birth,
      country = excluded.country,
      region = excluded.region,
      city = excluded.city,
      education_level = excluded.education_level,
      school = excluded.school,
      field_of_study = excluded.field_of_study,
      graduation_year = excluded.graduation_year,
      blood_type = excluded.blood_type,
      telegram_id = excluded.telegram_id,
      telegram_username = excluded.telegram_username,
      updated_at = datetime('now')
    """

    registration_sql = """
    INSERT INTO user_registration_info (
      membership_number,
      where_heard_about_us,
      motivation_letter,
      friends_on_platform,
      interest_in_volunteering
    )
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(membership_number) DO UPDATE SET
      where_heard_about_us = excluded.where_heard_about_us,
      motivation_letter = excluded.motivation_letter,
      friends_on_platform = excluded.friends_on_platform,
      interest_in_volunteering = excluded.interest_in_volunteering,
      updated_at = datetime('now')
    """

    conn.execute(user_sql, (membership_number, email, password_hash))
    conn.execute(
        user_info_sql,
        (
            membership_number,
            get_value(row, "İsim - Soyisim") or get_value(row, "الاسم والكنية") or "Unknown",
            get_value(row, "الاسم والكنية") or get_value(row, "İsim - Soyisim") or "Unknown",
            clean_phone(get_value(row, "رقم الهاتف (التركي)", "رقم الواتس آب")),
            normalize_sex(get_value(row, "الجنس")),
            get_value(row, "تاريخ الميلاد"),
            normalize_country(get_value(row, "هل أنت؟")),
            get_value(row, "منطقة الإقامة"),
            get_value(row, "مدينة الإقامة"),
            get_value(row, "السنة"),
            get_value(row, "الجامعة"),
            get_value(row, "الفرع"),
            parse_graduation_year(get_value(row, "السنة")),
            normalize_blood_type(get_value(row, "زمرة الدم")),
            get_value(row, "telegram_id"),
            get_value(row, "telegram_username"),
        ),
    )
    conn.execute(
        registration_sql,
        (
            membership_number,
            get_value(row, "من أين سمعت بتجمّع إبتكار؟"),
            get_value(row, "ما الهدف الذي تسعى لتحقيقه من خلال انضمامك لمجتمعنا؟"),
            get_value(row, "هل يمكنك ذكر اسمين لأشخاص تعرفهم من تجمع إبتكار\n(أو كتابة لا يوجد)"),
            map_volunteering(get_value(row, "منبر المتطوعين")),
        ),
    )


def run_import(db_path: str, csv_path: str, dry_run: bool) -> ImportStats:
    stats = ImportStats()

    rows = read_csv_rows(csv_path)
    stats.total_rows = len(rows)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        conn.execute("BEGIN")
        for index, row in enumerate(rows, start=1):
            try:
                upsert_row(conn, row)
                stats.imported_rows += 1
            except Exception as exc:
                stats.failed_rows += 1
                membership_number = get_value(row, "رقم العضوية")
                print(f"[row {index}] failed for membership={membership_number!r}: {exc}")

        if dry_run:
            conn.execute("ROLLBACK")
            stats.skipped_rows = stats.imported_rows
            stats.imported_rows = 0
        else:
            conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        raise
    finally:
        conn.close()

    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import old.csv into the new membership database.")
    parser.add_argument("--db", required=True, help="Path to target SQLite DB file")
    parser.add_argument("--csv", required=True, help="Path to source CSV file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and parse all rows, then rollback instead of committing",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db_path = os.path.abspath(args.db)
    csv_path = os.path.abspath(args.csv)

    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return 2

    if not os.path.exists(db_path):
        print(f"DB file not found: {db_path}")
        return 2

    stats = run_import(db_path=db_path, csv_path=csv_path, dry_run=args.dry_run)
    mode = "DRY RUN" if args.dry_run else "COMMIT"
    print(f"Mode: {mode}")
    print(f"Total rows:   {stats.total_rows}")
    print(f"Imported:     {stats.imported_rows}")
    print(f"Rolled back:  {stats.skipped_rows}")
    print(f"Failed rows:  {stats.failed_rows}")

    # Return non-zero when there are row-level failures.
    return 1 if stats.failed_rows > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
