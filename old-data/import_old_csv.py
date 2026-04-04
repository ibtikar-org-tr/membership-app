#!/usr/bin/env python3
"""Generate SQL INSERT statements from legacy membership CSV data.

Usage:
    python old-data/import_old_csv.py \
        --csv old-data/old.csv \
        --out old-data/import_old.sql

Notes:
- This script is standalone and does not touch application runtime code.
- It does not connect to any database.
- It writes SQL INSERT/UPSERT statements that can be executed later.
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import os
import secrets
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

    # Additional fallback for slight header variants (case or hidden punctuation).
    for header in candidate_headers:
        header_folded = header.casefold()
        for key in row.keys():
            if header_folded in key.casefold():
                return clean(row.get(key))

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


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def render_upsert_sql(row: dict[str, str]) -> list[str]:
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
    en_name = get_value(row, "İsim - Soyisim") or get_value(row, "الاسم والكنية") or "Unknown"
    ar_name = get_value(row, "الاسم والكنية") or get_value(row, "İsim - Soyisim") or "Unknown"
    phone_number = clean_phone(get_value(row, "رقم الهاتف (التركي)", "رقم الواتس آب"))
    sex = normalize_sex(get_value(row, "الجنس"))
    date_of_birth = get_value(row, "تاريخ الميلاد")
    country = normalize_country(get_value(row, "هل أنت؟"))
    region = get_value(row, "منطقة الإقامة")
    city = get_value(row, "مدينة الإقامة")
    education_level = get_value(row, "السنة")
    school = get_value(row, "الجامعة")
    field_of_study = get_value(row, "الفرع")
    graduation_year = parse_graduation_year(get_value(row, "السنة"))
    blood_type = normalize_blood_type(get_value(row, "زمرة الدم"))
    telegram_id = get_value(row, "telegram_id")
    telegram_username = get_value(row, "telegram_username")

    where_heard_about_us = get_value(row, "من أين سمعت بتجمّع إبتكار؟")
    motivation_letter = get_value(row, "ما الهدف الذي تسعى لتحقيقه من خلال انضمامك لمجتمعنا؟")
    friends_on_platform = get_value(row, "هل يمكنك ذكر اسمين لأشخاص تعرفهم من تجمع إبتكار\n(أو كتابة لا يوجد)")
    interest_in_volunteering = map_volunteering(get_value(row, "منبر المتطوعين"))

    user_sql = f"""
    INSERT INTO users (membership_number, email, password_hash, role)
    VALUES ({sql_literal(membership_number)}, {sql_literal(email)}, {sql_literal(password_hash)}, 'member')
    ON CONFLICT(membership_number) DO UPDATE SET
      email = excluded.email,
      password_hash = excluded.password_hash,
      updated_at = datetime('now')
    ;""".strip()

    user_info_sql = f"""
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
    VALUES (
      {sql_literal(membership_number)},
      {sql_literal(en_name)},
      {sql_literal(ar_name)},
      {sql_literal(phone_number)},
      {sql_literal(sex)},
      {sql_literal(date_of_birth)},
      {sql_literal(country)},
      {sql_literal(region)},
      {sql_literal(city)},
      {sql_literal(education_level)},
      {sql_literal(school)},
      {sql_literal(field_of_study)},
      {sql_literal(graduation_year)},
      {sql_literal(blood_type)},
      {sql_literal(telegram_id)},
      {sql_literal(telegram_username)}
    )
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
    ;""".strip()

    registration_sql = f"""
    INSERT INTO user_registration_info (
      membership_number,
      where_heard_about_us,
      motivation_letter,
      friends_on_platform,
      interest_in_volunteering
    )
    VALUES (
      {sql_literal(membership_number)},
      {sql_literal(where_heard_about_us)},
      {sql_literal(motivation_letter)},
      {sql_literal(friends_on_platform)},
      {sql_literal(interest_in_volunteering)}
    )
    ON CONFLICT(membership_number) DO UPDATE SET
      where_heard_about_us = excluded.where_heard_about_us,
      motivation_letter = excluded.motivation_letter,
      friends_on_platform = excluded.friends_on_platform,
      interest_in_volunteering = excluded.interest_in_volunteering,
      updated_at = datetime('now')
    ;""".strip()

    return [user_sql, user_info_sql, registration_sql]


def generate_sql_file(csv_path: str, out_path: str, dry_run: bool) -> ImportStats:
    stats = ImportStats()

    rows = read_csv_rows(csv_path)
    stats.total_rows = len(rows)

    sql_lines: list[str] = [
        "-- Generated by old-data/import_old_csv.py",
        "BEGIN TRANSACTION;",
    ]

    for index, row in enumerate(rows, start=1):
        try:
            statements = render_upsert_sql(row)
            sql_lines.extend(statements)
            stats.imported_rows += 1
        except Exception as exc:
            stats.failed_rows += 1
            membership_number = get_value(row, "رقم العضوية")
            sql_lines.append(
                f"-- [row {index}] failed for membership={membership_number!r}: {str(exc).replace(chr(10), ' ')}"
            )
            print(f"[row {index}] failed for membership={membership_number!r}: {exc}")

    if dry_run:
        sql_lines.append("ROLLBACK;")
        stats.skipped_rows = stats.imported_rows
        stats.imported_rows = 0
    else:
        sql_lines.append("COMMIT;")

    with open(out_path, "w", encoding="utf-8", newline="\n") as file_obj:
        file_obj.write("\n\n".join(sql_lines))
        file_obj.write("\n")

    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate SQL INSERT script from old.csv data.")
    parser.add_argument("--csv", required=True, help="Path to source CSV file")
    parser.add_argument("--out", required=True, help="Path to output SQL file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate SQL but end it with ROLLBACK instead of COMMIT",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    csv_path = os.path.abspath(args.csv)
    out_path = os.path.abspath(args.out)

    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return 2

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)

    stats = generate_sql_file(csv_path=csv_path, out_path=out_path, dry_run=args.dry_run)
    mode = "DRY RUN" if args.dry_run else "COMMIT"
    print(f"Mode: {mode}")
    print(f"Output SQL:   {out_path}")
    print(f"Total rows:   {stats.total_rows}")
    print(f"Generated:    {stats.imported_rows}")
    print(f"Rolled back:  {stats.skipped_rows}")
    print(f"Failed rows:  {stats.failed_rows}")

    # Return non-zero when there are row-level failures.
    return 1 if stats.failed_rows > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
