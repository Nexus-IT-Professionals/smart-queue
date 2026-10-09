// Staff workspace — features from docs/TECHNICAL_PROPOSAL.md §4.
// Offers/status will refresh via short polling (no real-time infra).

const sections = [
  "Filters (date / office / insurance)",
  "Daily schedule",
  "Assisted registration",
  "Waitlist (priority / reason)",
  "Cancellation review",
  "Pending offers",
  "Exceptions / manual relocation",
  "Statistics",
  "Audit history",
];

export default function StaffWorkspace() {
  return (
    <div>
      <h2>Staff workspace</h2>
      {sections.map((title) => (
        <section key={title}>
          <h3>{title}</h3>
          <p>TODO</p>
        </section>
      ))}
    </div>
  );
}
