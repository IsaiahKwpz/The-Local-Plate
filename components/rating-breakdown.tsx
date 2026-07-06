type CategoryAggregate = {
  avg_taste_score: number | null;
  avg_value_score: number | null;
  avg_uniqueness_score: number | null;
  avg_healthiness_score: number | null;
} | null;

const CATEGORIES = [
  { field: "avg_taste_score", label: "Taste" },
  { field: "avg_value_score", label: "Value" },
  { field: "avg_uniqueness_score", label: "Uniqueness" },
  { field: "avg_healthiness_score", label: "Healthiness" },
] as const;

export function RatingBreakdown({ rating }: { rating: CategoryAggregate }) {
  if (!rating) return null;

  const present = CATEGORIES.filter(({ field }) => rating[field] != null);
  if (present.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
      {present.map(({ field, label }) => (
        <span key={field}>
          {label} <strong className="text-ink">{rating[field]!.toFixed(1)}</strong>
        </span>
      ))}
    </div>
  );
}
