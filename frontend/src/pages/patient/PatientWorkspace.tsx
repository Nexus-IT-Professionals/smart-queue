// Patient workspace — features from docs/TECHNICAL_PROPOSAL.md §4.
// A patient only ever sees their own data; the API enforces this.

const sections = [
  "Profile / registration",
  "Availability & contact preferences",
  "My appointment",
  "Cancellation request",
  "Offer inbox (accept / decline / help)",
];

export default function PatientWorkspace() {
  return (
    <div>
      <h2>Patient workspace</h2>
      {sections.map((title) => (
        <section key={title}>
          <h3>{title}</h3>
          <p>TODO</p>
        </section>
      ))}
    </div>
  );
}
