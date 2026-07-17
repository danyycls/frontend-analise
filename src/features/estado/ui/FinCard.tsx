export function FinCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="dm-card">
      <span className="dm-card-val">{value}</span>
      <span className="dm-card-lbl">{label}</span>
    </div>
  );
}
