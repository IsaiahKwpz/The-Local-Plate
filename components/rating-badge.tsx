type RatingAggregate = { avg_score: number | null; rating_count: number | null } | null;

export function RatingBadge({ rating, label }: { rating: RatingAggregate; label?: string }) {
  const prefix = label ? `${label}: ` : "";

  if (!rating || !rating.rating_count) {
    return <span className="text-sm text-gray-500">{prefix}No ratings yet</span>;
  }

  return (
    <span className="text-sm">
      {prefix}
      <strong>{rating.avg_score?.toFixed(1)}</strong> ({rating.rating_count})
    </span>
  );
}
