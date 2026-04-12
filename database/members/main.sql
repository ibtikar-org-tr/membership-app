CREATE TABLE IF NOT EXISTS users (
    membership_number TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    role TEXT NOT NULL DEFAULT 'member'
);

CREATE TRIGGER IF NOT EXISTS update_user_updated_at AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE membership_number = NEW.membership_number;
END;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_info (
    membership_number TEXT PRIMARY KEY REFERENCES users(membership_number) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    en_name TEXT NOT NULL,
    ar_name TEXT NOT NULL,
    phone_number TEXT UNIQUE, -- stored as a string with country code (e.g., "+905316781111")
    sex TEXT CHECK (sex IN ('male', 'female')),
    date_of_birth TEXT, -- stored as ISO 8601 string (e.g., "1990-01-01")
    country TEXT, -- ISO 3166-1 alpha-2 country code (e.g., "US", "TR", etc.)
    region TEXT, -- state/region or province within the country (e.g., "Istanbul", "Aleppo", "California" etc.)
    city TEXT, -- city of residence (e.g., "Fatih", "Al Bab", "Mezitli", "Azaz" etc.)
    address TEXT,
    education_level TEXT, -- highest level of education (e.g., "high_school", "bachelor", "master", "phd", etc.)
    school TEXT, -- name of the school or university
    field_of_study TEXT, -- field of study in the university or major in the high school
    graduation_year INTEGER, -- year of graduation from the high school or university
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    telegram_id TEXT UNIQUE, -- unique Telegram user ID (e.g., "123456789"), this will be stored by the bot
    telegram_username TEXT,
    social_media_links TEXT, -- JSON string for Dict<string, string> (e.g., {"github": "url", "linkedin": "url", ...})
    profile_picture_url TEXT,
    biography TEXT,
    interests TEXT, -- comma-separated list of interests or hobbies
    skills TEXT, -- comma-separated list of skills or expertise
    languages TEXT -- comma-separated list of languages spoken
);

CREATE TRIGGER IF NOT EXISTS update_user_info_updated_at AFTER UPDATE ON user_info
BEGIN
    UPDATE user_info SET updated_at = datetime('now') WHERE membership_number = NEW.membership_number;
END;

CREATE TABLE IF NOT EXISTS user_registration_info (
    membership_number TEXT PRIMARY KEY REFERENCES users(membership_number) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    where_heard_about_us TEXT, -- how the user heard about the platform (e.g., "friend", "social media", "event", etc.)
    motivation_letter TEXT, -- user's motivation for joining the platform
    friends_on_platform TEXT, -- friends the user knows on the platform (comma-separated list of membership numbers or names),
    interest_in_volunteering TEXT, -- user's interest in volunteering for the platform (e.g., "yes", "no", "maybe")
    previous_experience TEXT -- user's previous experience related to the platform's mission or activities
);

CREATE TRIGGER IF NOT EXISTS update_user_registration_info_updated_at AFTER UPDATE ON user_registration_info
BEGIN
    UPDATE user_registration_info SET updated_at = datetime('now') WHERE membership_number = NEW.membership_number;
END;
