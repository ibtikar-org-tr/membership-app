CREATE TABLE IF NOT EXISTS users (
    membership_number TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    role TEXT NOT NULL DEFAULT 'member',
)

CREATE TABLE IF NOT EXISTS user_info (
    membership_number TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    en_name TEXT NOT NULL,
    ar_name TEXT NOT NULL,
    phone_number TEXT,
    sex TEXT CHECK (sex IN ('male', 'female')),
    date_of_birth TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    education_level TEXT,
    school TEXT, -- name of the school or university
    graduation_year INTEGER, -- year of graduation from the high school or university
    field_of_study TEXT, -- field of study in the university or major in the high school
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    telegram_id TEXT,
    telegram_username TEXT,
    social_media_links TEXT, -- JSON string for Dict<string, string> (e.g., {"github": "url", "linkedin": "url", ...})
    profile_picture_url TEXT,
    biography TEXT,
    interests TEXT, -- comma-separated list of interests or hobbies
    skills TEXT, -- comma-separated list of skills or expertise
    languages TEXT, -- comma-separated list of languages spoken
);

CREATE TABLE IF NOT EXISTS user_registration_info (
    where_heard_about_us TEXT, -- how the user heard about the platform (e.g., "friend", "social media", "event", etc.)
    motivation_letter TEXT, -- user's motivation for joining the platform
    friends_on_platform TEXT, -- friends the user knows on the platform (comma-separated list of membership numbers or names),
    interest_in_volunteering TEXT, -- user's interest in volunteering for the platform (e.g., "yes", "no", "maybe")
    previous_experience TEXT, -- user's previous experience related to the platform's mission or activities
);



