// Mirrors public.is_low_trust() in
// supabase/migrations/20260709000000_contribution_flow.sql exactly - the
// database is the real enforcement (RLS blocks a low-trust user's direct
// UPDATE regardless of what the app does), but the app needs the same
// answer to decide whether to write live or queue a pending edit instead
// of just attempting the UPDATE and having it silently affect zero rows.
export function isLowTrust(profile: {
  created_at: string;
  trust_score: number;
  is_admin: boolean;
}): boolean {
  if (profile.is_admin) return false;

  const ageMs = Date.now() - new Date(profile.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  return ageDays < 7 || profile.trust_score < 5;
}
