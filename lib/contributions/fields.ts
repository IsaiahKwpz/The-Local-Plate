import type { Database } from "@/lib/supabase/types";

export const EDITABLE_FIELDS = ["name", "price", "category", "description"] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

type MenuItemUpdate = Database["public"]["Tables"]["menu_items"]["Update"];

// A computed-key object ({ [field]: value }) doesn't satisfy Supabase's
// generated (strict, no-excess-properties) Update type, so each field maps
// to its own literal key here instead.
export function buildMenuItemUpdate(field: EditableField, value: string): MenuItemUpdate {
  switch (field) {
    case "name":
      return { name: value };
    case "price":
      return { price: Number(value) };
    case "category":
      return { category: value };
    case "description":
      return { description: value };
  }
}
