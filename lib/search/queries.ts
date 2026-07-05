import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

export async function searchRestaurants(supabase: TypedClient, query: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, address, type, status")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(50);

  if (error) throw error;
  return data;
}

export async function searchMenuItems(supabase: TypedClient, query: string) {
  const { data, error } = await supabase.rpc("search_menu_items", { search_query: query });

  if (error) throw error;
  return data;
}

export type MenuItemSearchResult = {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  category: string | null;
  restaurant_id: string;
  restaurant_name: string;
  avg_score: number | null;
  rating_count: number | null;
};

// Dish-type tags only (not cuisine/attribute) - those are what "browse by
// category" means here. Counted client-side rather than via an embedded
// PostgREST count, since menu_item_tags has no restaurant-scoping to filter
// on and a plain fetch-then-count is simpler to get right.
export async function getBrowseCategories(supabase: TypedClient) {
  const [{ data: tags, error: tagsError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from("tags").select("id, name").eq("type", "dish_type"),
    supabase.from("menu_item_tags").select("tag_id"),
  ]);
  if (tagsError) throw tagsError;
  if (linksError) throw linksError;

  const countByTag = new Map<string, number>();
  for (const link of links) {
    countByTag.set(link.tag_id, (countByTag.get(link.tag_id) ?? 0) + 1);
  }

  return tags
    .map((t) => ({ id: t.id, name: t.name, count: countByTag.get(t.id) ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

// Mirrors search_menu_items' RPC shape so the search page can render both
// paths (free-text vs. category) with the same code. Originally two app-side
// queries (fetch matching item IDs, then fetch ratings via .in(ids)), but
// that broke for any popular tag - "Pizza" alone matches 115+ items, and
// that many UUIDs in a PostgREST .in() filter produces a request URL that
// exceeds the HTTP header size limit. Doing the join in the database (see
// migration 20260713000000) avoids ever shipping a large ID list at all.
export async function searchMenuItemsByTag(
  supabase: TypedClient,
  tagId: string,
): Promise<MenuItemSearchResult[]> {
  const { data, error } = await supabase.rpc("search_menu_items_by_tag", { target_tag_id: tagId });
  if (error) throw error;
  return data;
}

export function groupByRestaurant(items: MenuItemSearchResult[]) {
  const map = new Map<string, { restaurantId: string; restaurantName: string; items: MenuItemSearchResult[] }>();
  for (const item of items) {
    if (!map.has(item.restaurant_id)) {
      map.set(item.restaurant_id, {
        restaurantId: item.restaurant_id,
        restaurantName: item.restaurant_name,
        items: [],
      });
    }
    map.get(item.restaurant_id)!.items.push(item);
  }
  return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
}
