import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

// Most recent claim by this user for this restaurant, if any - lets the
// restaurant page show "pending review" instead of re-offering the claim
// button to someone who already submitted one.
export async function getOwnClaimStatus(
  supabase: TypedClient,
  restaurantId: string,
  userId: string,
): Promise<Database["public"]["Enums"]["edit_status"] | null> {
  const { data } = await supabase
    .from("restaurant_claims")
    .select("status")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.status ?? null;
}
