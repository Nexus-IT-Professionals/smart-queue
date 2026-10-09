"""Synthetic demo seed (TECHNICAL_PROPOSAL §1, §7).

SYNTHETIC DATA ONLY: one fictional office, fictional insurer labels, 20-30 appointments,
a small waitlist and pre-provisioned staff/patient accounts. No real people or contacts.
Repeatable reset: recreate the DB, then seed.

Run from backend/:  python -m seed.seed
"""

# TODO: reset via app.db.connect/init_db; insert office, insurers, users (hashed passwords),
#       patients, appointments and waitlist entries; label every record as synthetic.

if __name__ == "__main__":
    raise SystemExit("TODO: seed not implemented")
