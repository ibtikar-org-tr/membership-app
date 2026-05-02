# Legacy Data SQL Generator

This folder contains a standalone script that converts legacy CSV data into SQL statements for your new schema.

Script:
- `import_old_csv.py`

Input:
- `old.csv` (legacy export)

Output:
- SQL file with `INSERT ... ON CONFLICT ... DO UPDATE` statements for:
  - `users`
  - `user_info`
  - `user_registration_info`

The script does **not** connect to any database.

## 1. What the script does

- Reads your CSV file.
- Normalizes/cleans fields (phone, sex, blood type, country, etc.).
- Hashes plaintext passwords using PBKDF2-SHA256 in the same format used by backend.
- Generates a single SQL file wrapped in a transaction.

It supports two modes for education fields (`الجامعة`, `الفرع`, `السنة`):
- Heuristic mode (default fallback).
- DeepSeek mode (if API key is available).

## 2. Setup

From project root:

```bash
cd /home/msi/0volume/coding/ibtikar/VMS/membership-app
```

Create local env file (optional but recommended for DeepSeek):

```bash
cp .env.example .env
```

Then edit `.env` and set your key:

```env
DEEPSEEK_API_KEY=your_real_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_TIMEOUT=30
```

## 3. Usage

### A) Generate SQL (normal run)

```bash
python3 import_old_csv.py \
  --csv old.csv \
  --out import_old.sql
```

### B) Dry run (build SQL but end with ROLLBACK)

```bash
python3 import_old_csv.py \
  --csv old.csv \
  --out import_old.sql \
  --dry-run
```

### C) Test with only first N rows

Use this to run quickly on a small sample (data rows only, header excluded):

```bash
python3 import_old_csv.py \
  --csv old.csv \
  --out import_old.sample.sql \
  --limit 10 \
  --dry-run
```

### D) Use a custom env file path

```bash
python3 import_old_csv.py \
  --csv old.csv \
  --out import_old.sql \
  --env-file .env
```

### E) Override DeepSeek settings from CLI

```bash
python3 import_old_csv.py \
  --csv old.csv \
  --out import_old.sql \
  --deepseek-api-key "..." \
  --deepseek-model deepseek-chat \
  --deepseek-base-url https://api.deepseek.com \
  --deepseek-timeout 30
```

## 4. Configuration priority

For DeepSeek settings, priority is:
1. CLI arguments (`--deepseek-*`)
2. Environment variables from `--env-file` (default: `.env`)
3. Built-in defaults

If no API key is present, script automatically uses heuristic fallback.

## 5. Output and exit codes

Console summary includes:
- Mode (`COMMIT` or `DRY RUN`)
- DeepSeek status (enabled/disabled)
- Output SQL path
- Total rows
- Generated rows
- Failed rows

Exit code:
- `0`: no row-level failures
- `1`: one or more rows failed
- `2`: missing input file(s)

Rows that fail are logged with row index and membership number.

## 6. Notes

- `.env` is ignored by git to prevent leaking API keys.
- The generated SQL can be executed later against your database that already has the target schema.
