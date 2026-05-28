interface StatCardProps {
  label: string;
  value: number | string;
  description?: string;
}

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
