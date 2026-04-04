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
import json
import os
import secrets
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
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
    value = clean(_value)
    if value == "سوريا":
        return "SY"
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


def heuristic_education_mapping(
    university_raw: str | None,
    major_raw: str | None,
    year_raw: str | None,
) -> dict[str, Any]:
    year_value = clean(year_raw)
    graduation_year = parse_graduation_year(year_value)

    education_level = None
    if year_value and graduation_year is None:
        lowered = year_value.lower()
        if lowered in {"متخرج", "خريج", "graduated", "graduate"}:
            education_level = "graduated"
        elif lowered in {"دراسات عليا", "masters", "master", "yüksek lisans"}:
            education_level = "master"
        elif lowered in {"phd", "doctorate", "دكتوراه"}:
            education_level = "phd"
        else:
            education_level = year_value

    return {
        "school": clean(university_raw),
        "field_of_study": clean(major_raw),
        "education_level": education_level,
        "graduation_year": graduation_year,
    }


def extract_json_object(text: str) -> dict[str, Any] | None:
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        parsed = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def infer_education_with_deepseek(
    university_raw: str | None,
    major_raw: str | None,
    year_raw: str | None,
    *,
    api_key: str | None,
    model: str,
    base_url: str,
    timeout_seconds: int,
    cache: dict[tuple[str | None, str | None, str | None], dict[str, Any]],
) -> dict[str, Any]:
    cache_key = (clean(university_raw), clean(major_raw), clean(year_raw))
    if cache_key in cache:
        return cache[cache_key]

    fallback = heuristic_education_mapping(university_raw, major_raw, year_raw)
    if not api_key:
        cache[cache_key] = fallback
        return fallback

    prompt = {
        "school_raw": clean(university_raw),
        "field_raw": clean(major_raw),
        "year_raw": clean(year_raw),
        "task": "Normalize education fields.",
        "rules": {
            "education_level": "One of: high_school, diploma, bachelor, master, phd, other, or null",
            "graduation_year": "4-digit integer that is graduation year, calculate it if the student's current year is provided (assume we are in 2025), or null if unknown",
            "school": "Normalized institution name or null",
            "field_of_study": "Normalized major/field or null",
        },
        "output": "Return ONLY JSON with keys: education_level, graduation_year, school, field_of_study",
    }

    body = {
        "model": model,
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": "You normalize education-related form values. Return strict JSON only.",
            },
            {
                "role": "user",
                "content": json.dumps(prompt, ensure_ascii=False),
            },
        ],
    }

    try:
        endpoint = base_url.rstrip("/") + "/chat/completions"
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))

        content = (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        parsed = extract_json_object(content) or {}

        result = {
            "school": clean(parsed.get("school")) or fallback["school"],
            "field_of_study": clean(parsed.get("field_of_study")) or fallback["field_of_study"],
            "education_level": clean(parsed.get("education_level")) or fallback["education_level"],
            "graduation_year": parsed.get("graduation_year"),
        }

        if not isinstance(result["graduation_year"], int):
            result["graduation_year"] = fallback["graduation_year"]

        cache[cache_key] = result
        return result
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError, IndexError):
        cache[cache_key] = fallback
        return fallback


def heuristic_normalize_friends(raw_value: str | None) -> str | None:
    value = clean(raw_value)
    if value is None:
        return None

    lowered = value.casefold()
    none_tokens = {
        "لا يوجد",
        "لايوجد",
        "none",
        "n/a",
        "na",
        "no one",
        "unknown",
        "-",
        ".",
    }
    if lowered in none_tokens:
        return None

    invitation_markers = (
        "تمت دعوتي",
        "دعوتي",
        "invited",
        "via",
        "عبر العضو",
        "عن طريق",
    )

    normalized = value.replace("\n", ", ").replace(";", ",").replace("،", ",")
    parts = [clean(part) for part in normalized.split(",")]
    parts = [part for part in parts if part]

    filtered_parts: list[str] = []
    for part in parts:
        part_lower = part.casefold()
        if any(marker in part_lower for marker in invitation_markers):
            continue
        filtered_parts.append(part)

    # Deduplicate while preserving order.
    seen: set[str] = set()
    deduped: list[str] = []
    for part in filtered_parts:
        key = part.casefold()
        if key not in seen:
            seen.add(key)
            deduped.append(part)

    return ", ".join(deduped) if deduped else None


def normalize_comma_separated_value(value: str | None) -> str | None:
    cleaned = clean(value)
    if cleaned is None:
        return None

    pieces = [clean(part) for part in cleaned.replace("\n", ",").replace(";", ",").replace("،", ",").split(",")]
    pieces = [piece for piece in pieces if piece]
    if not pieces:
        return None

    seen: set[str] = set()
    normalized_parts: list[str] = []
    for piece in pieces:
        key = piece.casefold()
        if key not in seen:
            seen.add(key)
            normalized_parts.append(piece)

    return ", ".join(normalized_parts)


def infer_friends_with_deepseek(
    raw_value: str | None,
    *,
    api_key: str | None,
    model: str,
    base_url: str,
    timeout_seconds: int,
    cache: dict[str | None, str | None],
) -> str | None:
    raw_clean = clean(raw_value)
    if raw_clean in cache:
        return cache[raw_clean]

    fallback = heuristic_normalize_friends(raw_clean)
    if not api_key:
        cache[raw_clean] = fallback
        return fallback

    prompt = {
        "friends_raw": raw_clean,
        "task": "Normalize this field into a comma-separated list of names only.",
        "rules": [
            "If the value means no friends (e.g., لا يوجد), return null.",
            "Remove extra punctuation and repeated names.",
            "Keep names as-is (Arabic/Turkish/English) without transliteration.",
        ],
        "output": "Return ONLY JSON: {\"friends_on_platform\": string|null}",
    }

    body = {
        "model": model,
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": "You normalize names list fields. Return strict JSON only.",
            },
            {
                "role": "user",
                "content": json.dumps(prompt, ensure_ascii=False),
            },
        ],
    }

    try:
        endpoint = base_url.rstrip("/") + "/chat/completions"
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))

        content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = extract_json_object(content) or {}
        normalized = normalize_comma_separated_value(heuristic_normalize_friends(clean(parsed.get("friends_on_platform"))))
        result = normalized if normalized is not None else fallback
        cache[raw_clean] = result
        return result
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError, IndexError):
        cache[raw_clean] = fallback
        return fallback


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


def load_env_file(env_path: str) -> None:
    path = Path(env_path)
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def render_upsert_sql(
    row: dict[str, str],
    *,
    deepseek_api_key: str | None,
    deepseek_model: str,
    deepseek_base_url: str,
    deepseek_timeout_seconds: int,
    education_cache: dict[tuple[str | None, str | None, str | None], dict[str, Any]],
    friends_cache: dict[str | None, str | None],
) -> list[str]:
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
    education = infer_education_with_deepseek(
        get_value(row, "الجامعة"),
        get_value(row, "الفرع"),
        get_value(row, "السنة"),
        api_key=deepseek_api_key,
        model=deepseek_model,
        base_url=deepseek_base_url,
        timeout_seconds=deepseek_timeout_seconds,
        cache=education_cache,
    )
    education_level = education["education_level"]
    school = education["school"]
    field_of_study = education["field_of_study"]
    graduation_year = education["graduation_year"]
    blood_type = normalize_blood_type(get_value(row, "زمرة الدم"))
    telegram_id = get_value(row, "telegram_id")
    telegram_username = get_value(row, "telegram_username")

    where_heard_about_us = get_value(row, "من أين سمعت بتجمّع إبتكار؟")
    motivation_letter = get_value(row, "ما الهدف الذي تسعى لتحقيقه من خلال انضمامك لمجتمعنا؟")
    friends_on_platform = infer_friends_with_deepseek(
        get_value(row, "هل يمكنك ذكر اسمين لأشخاص تعرفهم من تجمع إبتكار\n(أو كتابة لا يوجد)"),
        api_key=deepseek_api_key,
        model=deepseek_model,
        base_url=deepseek_base_url,
        timeout_seconds=deepseek_timeout_seconds,
        cache=friends_cache,
    )
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


def generate_sql_file(
    csv_path: str,
    out_path: str,
    dry_run: bool,
    row_limit: int | None,
    *,
    deepseek_api_key: str | None,
    deepseek_model: str,
    deepseek_base_url: str,
    deepseek_timeout_seconds: int,
) -> ImportStats:
    stats = ImportStats()

    all_rows = read_csv_rows(csv_path)
    rows = all_rows if row_limit is None else all_rows[:row_limit]
    stats.total_rows = len(rows)

    sql_lines: list[str] = [
        "-- Generated by old-data/import_old_csv.py",
        "BEGIN TRANSACTION;",
    ]
    education_cache: dict[tuple[str | None, str | None, str | None], dict[str, Any]] = {}
    friends_cache: dict[str | None, str | None] = {}

    for index, row in enumerate(rows, start=1):
        try:
            statements = render_upsert_sql(
                row,
                deepseek_api_key=deepseek_api_key,
                deepseek_model=deepseek_model,
                deepseek_base_url=deepseek_base_url,
                deepseek_timeout_seconds=deepseek_timeout_seconds,
                education_cache=education_cache,
                friends_cache=friends_cache,
            )
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
        "--limit",
        type=int,
        default=None,
        help="Process only the first N data rows from CSV (for testing)",
    )
    parser.add_argument(
        "--env-file",
        default="old-data/.env",
        help="Path to .env file for DeepSeek settings",
    )
    parser.add_argument(
        "--deepseek-api-key",
        default=None,
        help="DeepSeek API key (overrides env)",
    )
    parser.add_argument(
        "--deepseek-model",
        default=None,
        help="DeepSeek model name (overrides env)",
    )
    parser.add_argument(
        "--deepseek-base-url",
        default=None,
        help="DeepSeek base URL (overrides env)",
    )
    parser.add_argument(
        "--deepseek-timeout",
        type=int,
        default=None,
        help="DeepSeek request timeout in seconds (overrides env)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate SQL but end it with ROLLBACK instead of COMMIT",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    load_env_file(args.env_file)

    deepseek_api_key = args.deepseek_api_key or os.getenv("DEEPSEEK_API_KEY")
    deepseek_model = args.deepseek_model or "deepseek-chat"
    deepseek_base_url = args.deepseek_base_url or "https://api.deepseek.com"
    deepseek_timeout = args.deepseek_timeout or 30

    csv_path = os.path.abspath(args.csv)
    out_path = os.path.abspath(args.out)

    if args.limit is not None and args.limit <= 0:
        print("--limit must be a positive integer")
        return 2

    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return 2

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)

    stats = generate_sql_file(
        csv_path=csv_path,
        out_path=out_path,
        dry_run=args.dry_run,
        row_limit=args.limit,
        deepseek_api_key=deepseek_api_key,
        deepseek_model=deepseek_model,
        deepseek_base_url=deepseek_base_url,
        deepseek_timeout_seconds=deepseek_timeout,
    )
    mode = "DRY RUN" if args.dry_run else "COMMIT"
    print(f"Mode: {mode}")
    print(f"DeepSeek:     {'enabled' if deepseek_api_key else 'disabled (heuristic fallback)'}")
    print(f"Output SQL:   {out_path}")
    print(f"Total rows:   {stats.total_rows}")
    print(f"Generated:    {stats.imported_rows}")
    print(f"Rolled back:  {stats.skipped_rows}")
    print(f"Failed rows:  {stats.failed_rows}")

    # Return non-zero when there are row-level failures.
    return 1 if stats.failed_rows > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
