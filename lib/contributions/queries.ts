import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

export async function getAppliedTagsForItem(supabase: TypedClient, menuItemId: string) {
  const { data, error } = await supabase
    .from("menu_item_tags")
    .select("tag:tags(id, name, type)")
    .eq("menu_item_id", menuItemId);
  if (error) throw error;
  return data.map((row) => row.tag).filter((tag) => tag !== null);
}

// Batched form of getAppliedTagsForItem for a whole restaurant's menu at
// once (powers the in-page menu search/filter, which needs every item's
// tag names up front rather than one round trip per item).
export async function getAppliedTagNamesForItems(
  supabase: TypedClient,
  menuItemIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (menuItemIds.length === 0) return map;

  const { data, error } = await supabase
    .from("menu_item_tags")
    .select("menu_item_id, tag:tags(name)")
    .in("menu_item_id", menuItemIds);
  if (error) throw error;

  for (const row of data) {
    if (!row.tag) continue;
    const existing = map.get(row.menu_item_id) ?? [];
    existing.push(row.tag.name);
    map.set(row.menu_item_id, existing);
  }
  return map;
}

export async function getAvailableTagsForItem(supabase: TypedClient, menuItemId: string) {
  const [{ data: allTags, error: allTagsError }, { data: applied, error: appliedError }] = await Promise.all([
    supabase.from("tags").select("id, name, type").order("name"),
    supabase.from("menu_item_tags").select("tag_id").eq("menu_item_id", menuItemId),
  ]);
  if (allTagsError) throw allTagsError;
  if (appliedError) throw appliedError;

  const appliedIds = new Set(applied.map((row) => row.tag_id));
  return allTags.filter((tag) => !appliedIds.has(tag.id));
}
