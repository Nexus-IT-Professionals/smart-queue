-- Proposed entities (TECHNICAL_PROPOSAL §6). Instants stored as UTC ISO-8601 text.
-- TODO: confirm columns with the team; all data is synthetic.

CREATE TABLE IF NOT EXISTS offices (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS insurers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL  -- fictional catalog label only
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff', 'patient')),
    office_id INTEGER REFERENCES offices(id),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,  -- opaque token
    user_id INTEGER NOT NULL REFERENCES users(id),
    csrf_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    office_id INTEGER NOT NULL REFERENCES offices(id),
    insurer_id INTEGER REFERENCES insurers(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    record_id TEXT NOT NULL UNIQUE,  -- demo record ID
    email TEXT,
    phone TEXT,
    contact_preference TEXT CHECK (contact_preference IN ('app', 'email', 'phone')),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY,
    office_id INTEGER NOT NULL REFERENCES offices(id),
    patient_id INTEGER REFERENCES patients(id),
    starts_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('booked', 'cancelled', 'completed')),
    cancelled_by TEXT CHECK (cancelled_by IN ('patient', 'provider')),
    cancel_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Unique active booking per slot.
CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_active_slot
    ON appointments (office_id, starts_at) WHERE status = 'booked';

CREATE TABLE IF NOT EXISTS waitlist_entries (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    office_id INTEGER NOT NULL REFERENCES offices(id),
    insurer_id INTEGER REFERENCES insurers(id),
    desired_date TEXT,
    desired_time TEXT,
    priority INTEGER CHECK (priority IN (1, 2, 3)),  -- staff-assigned; ordering TBD (§2)
    reason TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id),  -- vacated slot
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    waitlist_entry_id INTEGER REFERENCES waitlist_entries(id),
    state TEXT NOT NULL CHECK (state IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TEXT NOT NULL,
    responded_at TEXT,
    created_at TEXT NOT NULL
);

-- At most one pending offer per vacated slot (sequential offers).
CREATE UNIQUE INDEX IF NOT EXISTS ux_offers_pending_slot
    ON offers (appointment_id) WHERE state = 'pending';

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    offer_id INTEGER REFERENCES offers(id),
    channel TEXT NOT NULL DEFAULT 'in_app',  -- simulated; not SMS/email delivery
    body TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    detail TEXT,  -- no raw reply/contact text
    created_at TEXT NOT NULL
);
