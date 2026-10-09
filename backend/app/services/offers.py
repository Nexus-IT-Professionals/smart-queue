"""Sequential offers and atomic acceptance (TECHNICAL_PROPOSAL §6)."""

# TODO: create_offer(slot, waitlist_entry, expiry) — one pending offer per slot at a time.
# TODO: accept_offer(offer_id, session) — one short transaction checking ownership, pending
#       state, expiry and slot availability; idempotent; release the old appointment only
#       inside the same successful transaction.
# TODO: decline_offer / expire_offers — resolve expiry on reads/actions and at startup.
