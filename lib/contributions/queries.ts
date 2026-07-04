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
