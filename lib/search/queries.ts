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
