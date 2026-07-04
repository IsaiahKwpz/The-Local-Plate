import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

export type ReportWithPreview = Database["public"]["Tables"]["reports"]["Row"] & {
  reporterName: string | null;
  preview: string;
  // Formatted server-side, once, and passed down as a plain string - doing
  // `new Date(...).toLocaleString()` inside the Client Component ReportRow
  // caused a hydration mismatch (Node's default locale on the server
  // formats differently than the browser's locale on the client).
  createdAtLabel: string;
};

// Uses the service-role client - RLS on `reports` only lets a regular user
// see their own reports, but the moderation queue needs to see all of them,
// including the reporter_id IS NULL rows step 6's anomaly detection writes.
export async function getOpenReports(admin: TypedClient): Promise<ReportWithPreview[]> {
  const { data: reports, error } = await admin
    .from("reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const reporterIds = [
    ...new Set(reports.map((r) => r.reporter_id).filter((id): id is string => !!id)),
  ];
  const { data: reporters } = reporterIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", reporterIds)
    : { data: [] };
  const reporterNameById = new Map((reporters ?? []).map((p) => [p.id, p.display_name]));

  const menuItemIds = reports.filter((r) => r.target_type === "menu_item").map((r) => r.target_id);
  const restaurantIds = reports
    .filter((r) => r.target_type === "restaurant")
    .map((r) => r.target_id);
  const ratingIds = reports.filter((r) => r.target_type === "rating").map((r) => r.target_id);

  const [menuItemsRes, restaurantsRes, ratingsRes] = await Promise.all([
    menuItemIds.length
      ? admin.from("menu_items").select("id, name, restaurant:restaurants(name)").in("id", menuItemIds)
      : Promise.resolve({ data: [] as { id: string; name: string; restaurant: { name: string } | null }[] }),
    restaurantIds.length
      ? admin.from("restaurants").select("id, name").in("id", restaurantIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ratingIds.length
      ? admin
          .from("ratings")
          .select("id, score, comment, user:profiles(display_name), menu_item:menu_items(name)")
          .in("id", ratingIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            score: number;
            comment: string | null;
            user: { display_name: string | null } | null;
            menu_item: { name: string } | null;
          }[],
        }),
  ]);

  const menuItemById = new Map((menuItemsRes.data ?? []).map((m) => [m.id, m]));
  const restaurantById = new Map((restaurantsRes.data ?? []).map((r) => [r.id, r]));
  const ratingById = new Map((ratingsRes.data ?? []).map((r) => [r.id, r]));

  return reports.map((report) => {
    let preview = "(content no longer exists)";

    if (report.target_type === "menu_item") {
      const item = menuItemById.get(report.target_id);
      if (item) preview = `Menu item "${item.name}" at ${item.restaurant?.name ?? "unknown restaurant"}`;
    } else if (report.target_type === "restaurant") {
      const restaurant = restaurantById.get(report.target_id);
      if (restaurant) preview = `Restaurant "${restaurant.name}"`;
    } else if (report.target_type === "rating") {
      const rating = ratingById.get(report.target_id);
      if (rating) {
        const who = rating.user?.display_name ?? "unknown user";
        const on = rating.menu_item?.name ?? "unknown item";
        const comment = rating.comment ? `: "${rating.comment}"` : "";
        preview = `${rating.score}★ rating on "${on}" by ${who}${comment}`;
      }
    }

    return {
      ...report,
      reporterName: report.reporter_id ? (reporterNameById.get(report.reporter_id) ?? "Unknown") : null,
      preview,
      createdAtLabel: new Date(report.created_at).toLocaleString(),
    };
  });
}

export async function getAllRestaurantsForMerge(admin: TypedClient) {
  const { data, error } = await admin
    .from("restaurants")
    .select("id, name, address")
    .order("name");
  if (error) throw error;
  return data;
}
