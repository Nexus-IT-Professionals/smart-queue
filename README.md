# Smart Appointment Queue

Help Puerto Rico medical offices fill cancelled appointments by offering available slots to waiting patients and recording each change.

## Project status

This project is in its initial planning stage for the Caribbean AI 2026 Hackathon. This README describes the proposed MVP; application code and setup instructions will follow.

## The problem

Cancellations leave gaps in office schedules while patients call repeatedly to find earlier appointments. Reception staff need a simple way to match available slots with patients on a waitlist.

## Initial MVP

Start with one medical office, synthetic patient data, and simulated messages.

- Display a daily appointment schedule and patient waitlist.
- Let staff confirm a cancellation and open a slot.
- Match patients using availability preferences and offer the slot to one patient at a time.
- Confirm a booking once; move to the next candidate when an offer expires or is declined.
- Record cancellations, offers, responses, and bookings in an activity log.
- Track opened slots, offers sent, and confirmed replacements.

## Basic flow

Staff confirms a cancellation → system finds a matching patient → simulated offer is sent → patient responds → booking updates → activity is recorded.

## Proposed AI role

Interpret short Spanish or English replies as acceptance, decline, or a request for help. Ambiguous replies go to staff for review, and a manual response selector remains available if AI fails.

Booking rules control availability, offer expiry, and duplicate acceptance. Patients must confirm before their appointments change.

## Demo scenario

A fictional office cancels a 2 p.m. appointment. A waitlisted patient receives an offer and replies, “Sí, puedo llegar.” The system interprets the reply, confirms the replacement, and records the change. Additional scenarios demonstrate expired offers and duplicate acceptance handling.

## Next steps

1. Agree on offer order, expiry, and availability rules.
2. Choose the application stack and AI model.
3. Build the schedule, waitlist, and cancellation-to-booking flow.
4. Add reply interpretation, manual review, and the activity log.
5. Verify expiry, duplicate acceptance, ambiguous replies, and AI failure behavior.

Multi-office routing, real messaging, EHR integrations, predictive no-show scoring, clinical prioritization, and payments are outside the initial MVP.

## Source

Adapted from the planning README at `/Users/tarisadmin/Projects/CaribbeanAI2026_Hackathon/README.md`. The original contains additional research references, proposed stack options, and open questions.
